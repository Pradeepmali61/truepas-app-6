/** @jsxImportSource react */
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, RotateCcw, ScanLine, Zap, ZapOff } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View } from 'react-native';

import {
    RegulaScanCancelled,
    initializeRegula,
    isRegulaAvailable,
    scanDocument,
} from '@/features/documents/regulaScanner';
import { DocScanView, ScanPill, type ScanFrameSize } from '@/premium/DocScanView';
import { docMeta } from '@/premium/flows/documents';
import { C } from '@/premium/theme';
import { back, Button, IconCircle, Row, Txt } from '@/premium/ui';
import { setScanResult } from '@/services/scanStore';

type ScanStep = 'front' | 'selfie' | 'done';

/** Document scan — captures front of document (+ selfie for portrait documents).
 *  Document capture uses the Regula Document Reader native scanner (edge
 *  detection, auto-capture, perspective-corrected cropping) when the native
 *  modules are present, falling back to the manual expo-camera flow in Expo Go.
 *  Selfie capture always uses expo-camera. The scanner opens by itself the
 *  first time it is ready; if it fails to start, the page offers Retry or the
 *  camera instead.
 *  The captures go to document/processing via scanStore, which uploads them
 *  through presigned URLs (BACKEND_UPDATE_2026-10 §6.2); Regula runs
 *  server-side for OCR + authenticity + face match.
 *  `retake` param (set by the result screens): reset to a fresh capture.
 *  Family mode: when `family` param is set, routes to family/add/processing
 *  after capture instead of the user document processing screen. Birth
 *  certificates (0-4) skip the selfie step — no portrait, no face match. */
export default function DocumentScanScreen() {
  const router = useRouter();
  const { width: winW } = useWindowDimensions();
  const { type, label, expiresAt, family, personId, name, dob, relationship, band, retake } = useLocalSearchParams<{
    type?: string;
    label?: string;
    expiresAt?: string;
    family?: string;
    personId?: string;
    name?: string;
    dob?: string;
    relationship?: string;
    band?: string;
    retake?: string;
  }>();
  const isFamilyMode = family === '1';
  const isDocOnly = type === 'birthCertificate' || band === '0-4';
  // Family flow: the selfie step is skipped — face capture happens later via
  // the liveness flow (family/add/face-capture), so a separate selfie here is
  // redundant (it is never sent to the backend in family mode).
  const skipSelfie = isFamilyMode || isDocOnly;
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [capturing, setCapturing] = useState(false);
  const [step, setStep] = useState<ScanStep>('front');
  const [frontImage, setFrontImage] = useState<string | null>(null);
  // Regula-cropped document image for display (raw frame goes to backend).
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [selfieImage, setSelfieImage] = useState<string | null>(null);
  const [cameraLayout, setCameraLayout] = useState({ width: 0, height: 0 });
  const [torch, setTorch] = useState(false);

  // A result screen sent the user back here to retake: start a fresh capture
  // (state adjusted during render when the param changes).
  const [seenRetake, setSeenRetake] = useState(retake);
  if (retake !== seenRetake) {
    setSeenRetake(retake);
    setFrontImage(null);
    setFrontPreview(null);
    setSelfieImage(null);
    setStep('front');
  }

  // Frame dimensions shown on the camera overlay (manual fallback path only).
  // The SAME objects are passed to DocScanView, which centres the frame in the
  // camera view — the crop math in handleCapture depends on that. The Regula
  // scanner crops natively and does not use these.
  const FRONT_FRAME = useMemo<ScanFrameSize>(() => {
    const width = Math.round(Math.min(330, winW - 48));
    return { width, height: Math.round(width * (214 / 330)) };
  }, [winW]);
  const SELFIE_FRAME = useMemo<ScanFrameSize>(() => {
    const size = Math.round(Math.min(280, winW - 80));
    return { width: size, height: size, round: true };
  }, [winW]);

  // ── Regula native scanner state ──────────────────────────────────────────
  const regulaAvailable = useMemo(() => isRegulaAvailable(), []);
  // False → the manual expo-camera flow ("Use camera instead").
  const [useRegula, setUseRegula] = useState(regulaAvailable);
  const [regulaReady, setRegulaReady] = useState(false);
  const [regulaInitFailed, setRegulaInitFailed] = useState(false);
  const [regulaBusy, setRegulaBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  // Open the native scanner by itself only the first time it becomes ready.
  const autoOpened = useRef(false);

  // Request permission on mount if not yet determined
  useEffect(() => {
    if (permission === null) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Initialize Regula (native builds only). initializeRegula times out after
  // 20 s and can be retried; a failure shows Retry / Use camera instead.
  const initRegula = () =>
    initializeRegula()
      .then(() => setRegulaReady(true))
      .catch((e: any) => {
        console.error('[Scan] Regula init failed:', e?.message);
        setRegulaInitFailed(true);
      });

  useEffect(() => {
    if (!regulaAvailable) return;
    void initRegula();
  }, [regulaAvailable]);

  const retryRegulaInit = () => {
    setRegulaInitFailed(false);
    void initRegula();
  };

  // ── Regula scan (native scanner UI) ──────────────────────────────────────
  const handleRegulaScan = async () => {
    if (regulaBusy || !regulaReady) return;
    setRegulaBusy(true);
    setScanError(null);
    try {
      const result = await scanDocument();
      setFrontImage(result.imageBase64);
      setFrontPreview(result.previewBase64);
      // Doc-only + family mode: no separate selfie — face capture via liveness
      setStep(skipSelfie ? 'done' : 'selfie');
    } catch (e: any) {
      if (e instanceof RegulaScanCancelled) return; // user closed the scanner
      console.error('[Scan] Regula scan failed:', e?.message);
      setScanError("The scan didn't work. Please try again.");
    } finally {
      setRegulaBusy(false);
    }
  };

  // First time the scanner is ready (and the camera is allowed), open it —
  // the button stays for re-scans. Short delay so the page renders first.
  const cameraAllowed = !!permission?.granted;
  useEffect(() => {
    if (autoOpened.current || !regulaReady || !useRegula || !cameraAllowed || step !== 'front') return;
    const t = setTimeout(() => {
      autoOpened.current = true;
      void handleRegulaScan();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regulaReady, useRegula, cameraAllowed, step]);

  // ── Manual expo-camera capture (fallback path) ───────────────────────────
  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      if (!photo?.uri) return;

      // The camera preview fills the view with "cover" scaling (center-crop):
      // the preview shows only the middle portion of the full sensor photo.
      // To crop exactly what's inside the on-screen frame, map the frame's
      // view coordinates into photo coordinates via the cover transform.
      //
      // IMPORTANT: On Android, takePictureAsync often returns the photo in the
      // sensor's native landscape orientation (e.g. 4032×3024) even when the
      // phone is held in portrait and the preview shows portrait. We must
      // swap width/height so the photo's orientation matches the view's.
      let photoWidth = photo.width ?? 0;
      let photoHeight = photo.height ?? 0;
      const viewWidth = cameraLayout.width || photoWidth;
      const viewHeight = cameraLayout.height || photoHeight;

      // Detect orientation mismatch: photo is landscape but view is portrait (or vice versa)
      const photoIsLandscape = photoWidth > photoHeight;
      const viewIsLandscape = viewWidth > viewHeight;
      if (photoIsLandscape !== viewIsLandscape && photoWidth > 0 && photoHeight > 0) {
        console.log('[Scan] Photo orientation mismatch — swapping w/h. Original:', photoWidth, 'x', photoHeight);
        [photoWidth, photoHeight] = [photoHeight, photoWidth];
      }

      const frame = step === 'front' ? FRONT_FRAME : SELFIE_FRAME;

      // Cover transform: scale the photo so it covers the view, centered.
      const coverScale = Math.max(viewWidth / photoWidth, viewHeight / photoHeight);
      const offsetX = (viewWidth - photoWidth * coverScale) / 2; // ≤ 0
      const offsetY = (viewHeight - photoHeight * coverScale) / 2; // ≤ 0

      // Frame is centered in the camera view
      const frameViewX = (viewWidth - frame.width) / 2;
      const frameViewY = (viewHeight - frame.height) / 2;

      // View coords → photo coords (inverse of the cover transform)
      const cropX = (frameViewX - offsetX) / coverScale;
      const cropY = (frameViewY - offsetY) / coverScale;
      const cropW = frame.width / coverScale;
      const cropH = frame.height / coverScale;

      console.log('[Scan] crop mapping:', JSON.stringify({
        step,
        photo: { w: photoWidth, h: photoHeight },
        view: { w: viewWidth, h: viewHeight },
        coverScale: Number(coverScale.toFixed(3)),
        offset: { x: Number(offsetX.toFixed(1)), y: Number(offsetY.toFixed(1)) },
        crop: { x: Math.round(cropX), y: Math.round(cropY), w: Math.round(cropW), h: Math.round(cropH) },
      }));

      // Clamp the crop rect to the photo bounds and round to integers
      const clampedX = Math.max(0, Math.min(cropX, photoWidth));
      const clampedY = Math.max(0, Math.min(cropY, photoHeight));
      const crop = {
        originX: Math.round(clampedX),
        originY: Math.round(clampedY),
        width: Math.round(Math.max(0, Math.min(cropW, photoWidth - clampedX))),
        height: Math.round(Math.max(0, Math.min(cropH, photoHeight - clampedY))),
      };

      // Build actions: crop first, then resize to ~1600px wide
      const actions: ImageManipulator.Action[] = [];
      if (crop.width > 0 && crop.height > 0) {
        actions.push({ crop });
      }
      actions.push({ resize: { width: 1600 } });

      // Per KYC guide §6.3: resize to ~1600px + JPEG 0.8 before sending.
      const manipulated = await ImageManipulator.manipulateAsync(
        photo.uri,
        actions,
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true },
      );
      const base64 = manipulated.base64 ?? '';
      if (!base64) return;

      if (step === 'front') {
        setFrontImage(base64);
        // Manual capture is already cropped to the on-screen frame.
        setFrontPreview(base64);
        // Doc-only + family mode: no separate selfie — face capture via liveness
        setStep(skipSelfie ? 'done' : 'selfie');
      } else if (step === 'selfie') {
        setSelfieImage(base64);
        setStep('done');
      }
    } catch {
      // Ignore capture errors — let user retry
    } finally {
      setCapturing(false);
    }
  };

  const handleContinue = () => {
    // Store captured images for processing screen
    setScanResult({
      documentImageBase64: frontImage ?? undefined,
      documentPreviewBase64: frontPreview ?? undefined,
      selfieBase64: selfieImage ?? undefined,
    });

    if (isFamilyMode) {
      // Family flow — member is created (or document added) AFTER document capture
      router.replace({
        pathname: '/family/add/processing',
        params: {
          type: type ?? 'passport',
          personId: personId ?? '',
          name: name ?? '',
          dob: dob ?? '',
          relationship: relationship ?? '',
          band: band ?? '',
        },
      });
      return;
    }

    router.push({
      pathname: '/document/processing',
      params: {
        type: type ?? 'passport',
        label: label ?? '',
        expiresAt: expiresAt ?? '',
      },
    });
  };

  const handleRetake = () => {
    if (step === 'selfie') {
      setFrontImage(null);
      setFrontPreview(null);
      setStep('front');
    } else if (step === 'done') {
      if (skipSelfie) {
        // No selfie step in this flow — retake the document itself
        setFrontImage(null);
        setFrontPreview(null);
        setStep('front');
      } else {
        setSelfieImage(null);
        setStep('selfie');
      }
    }
  };

  const meta = docMeta(type);
  const scanTitle = `Scan ${meta.noun}`;
  // Every scan state gets a way out — the dark chrome has no other header,
  // so hardware back would otherwise be the only exit.
  const close = back;

  // Permission not yet determined — show loading
  if (permission === null) {
    return (
      <DocScanView topTitle={scanTitle} title="Camera access" hint="Requesting camera permission…" onBack={close} topRight={null} footer={null}>
        <ActivityIndicator size="large" color={C.sky} accessibilityLabel="Requesting camera permission" />
      </DocScanView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <DocScanView
        topTitle={scanTitle}
        title="Allow camera access"
        hint="Camera permission is required for document scanning."
        onBack={close}
        topRight={null}
        footer={<Button label="Grant permission" icon={Camera} onPress={() => void requestPermission()} />}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 48,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(8,182,252,0.14)',
            borderWidth: 1,
            borderColor: 'rgba(8,182,252,0.4)',
          }}>
          <Camera size={40} color={C.skyLight} strokeWidth={1.8} />
        </View>
      </DocScanView>
    );
  }

  // Done — show review and continue
  if (step === 'done') {
    const previewUri = frontPreview ?? frontImage;
    return (
      <DocScanView
        topTitle={scanTitle}
        title="Capture complete"
        hint={`${skipSelfie ? 'Document captured successfully.' : 'Document and selfie captured successfully.'} Tap continue to proceed.`}
        onBack={close}
        topRight={null}
        footer={
          <Row gap={10}>
            <View style={{ flex: 1 }}>
              <Button tone="glass" label={skipSelfie ? 'Retake document' : 'Retake selfie'} onPress={handleRetake} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Continue" onPress={handleContinue} />
            </View>
          </Row>
        }>
        <View style={{ alignItems: 'center', gap: 34 }}>
          {/* Captured previews — document crop + selfie */}
          <View>
            <View
              style={{
                width: FRONT_FRAME.width,
                height: FRONT_FRAME.height,
                borderRadius: 18,
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.25)',
                backgroundColor: 'rgba(255,255,255,0.06)',
              }}>
              {previewUri ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${previewUri}` }}
                  accessibilityLabel="Captured document"
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : null}
            </View>
            {!skipSelfie && selfieImage ? (
              <View
                style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -24,
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  overflow: 'hidden',
                  borderWidth: 3,
                  borderColor: C.sky,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                }}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${selfieImage}` }}
                  accessibilityLabel="Captured selfie"
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>
            ) : null}
          </View>
          <ScanPill label={skipSelfie ? 'Document captured' : 'Document + selfie captured'} tone="green" />
        </View>
      </DocScanView>
    );
  }

  const isFront = step === 'front';
  // Regula handles the front step with its own native scanner UI; the manual
  // camera view is used for the selfie step and as the fallback.
  const showRegulaUI = isFront && useRegula;
  const facing = isFront ? 'back' : 'front';

  // ── Regula native scanner UI (front step) ────────────────────────────────
  if (showRegulaUI && regulaInitFailed) {
    // The scanner didn't start (error or 20 s timeout): retry, or capture
    // with the camera instead.
    return (
      <DocScanView
        topTitle={scanTitle}
        title="Scanner didn't start"
        hint="Try again, or take the photo with your camera."
        onBack={close}
        topRight={null}
        frame={FRONT_FRAME}
        status="Scanner unavailable"
        statusTone="red"
        footer={
          <View style={{ gap: 12 }}>
            <Button label="Retry" icon={RotateCcw} onPress={retryRegulaInit} />
            <Button label="Use camera instead" tone="glass" icon={Camera} onPress={() => setUseRegula(false)} />
          </View>
        }
      />
    );
  }

  if (showRegulaUI) {
    return (
      <DocScanView
        topTitle={scanTitle}
        title="Scan front of document"
        hint="The scanner detects the document edges automatically and captures when it is aligned and in focus."
        onBack={close}
        topRight={null}
        frame={FRONT_FRAME}
        scanning={regulaBusy}
        status={regulaBusy ? 'Scanner open — align the document…' : regulaReady ? 'Scanner ready' : 'Preparing scanner…'}
        statusTone={regulaReady || regulaBusy ? 'sky' : 'muted'}
        footer={
          <View style={{ gap: 12 }}>
            {scanError ? (
              <Txt v="small" color={C.red} center>
                {scanError}
              </Txt>
            ) : null}
            <Button
              label={regulaReady ? 'Scan document' : 'Preparing scanner…'}
              icon={ScanLine}
              loading={regulaBusy}
              disabled={!regulaReady}
              onPress={handleRegulaScan}
            />
          </View>
        }
      />
    );
  }

  // ── Manual expo-camera UI (selfie step + front fallback) ─────────────────
  return (
    <DocScanView
      topTitle={isFront ? scanTitle : 'Selfie'}
      title={isFront ? 'Scan front of document' : 'Capture your selfie'}
      hint={isFront ? 'Align the document within the frame' : 'Look at the camera and hold still'}
      onBack={close}
      camera={
        <CameraView
          ref={cameraRef}
          facing={facing}
          active={true}
          style={{ flex: 1 }}
          mirror={!isFront}
          enableTorch={isFront && torch}
        />
      }
      onCameraLayout={(width, height) => setCameraLayout({ width, height })}
      frame={isFront ? FRONT_FRAME : SELFIE_FRAME}
      status={isDocOnly ? 'Document photo' : isFront ? 'Step 1 of 2 · Document' : 'Step 2 of 2 · Selfie'}
      topRight={
        isFront ? (
          <IconCircle
            icon={torch ? Zap : ZapOff}
            tone={torch ? 'sky' : 'glass'}
            label={torch ? 'Turn torch off' : 'Turn torch on'}
            onPress={() => setTorch((t) => !t)}
          />
        ) : null
      }
      gallery="soon"
      onCapture={handleCapture}
      capturing={capturing}
      captureLabel={isFront ? 'Capture document' : 'Capture selfie'}
    />
  );
}
