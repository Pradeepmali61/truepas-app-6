/** @jsxImportSource react */
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RotateCcw, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { refreshAfterVerify, useAddDocument } from '@/features/documents/hooks';
import { isApproved, verifyDocumentWithUploads, type VerifyUploadStep } from '@/features/documents/verifyWithUploads';
import { DocumentCard, docMeta, ScanHero, StepList, type FlowStepState } from '@/premium/flows/documents';
import { Banner } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Row, Screen, TopBar, Txt } from '@/premium/ui';
import { clearDocumentImages, saveDocumentImages } from '@/services/documentImageStore';
import { flowGuards } from '@/services/flowGuards';
import { clearScanResult, getScanResult } from '@/services/scanStore';
import { useAppSelector } from '@/store';
import type { DocumentType, IdentityDocument } from '@/types/domain';

type ProcessingStatus = 'adding' | 'uploading' | 'verifying' | 'done' | 'error';

const STEP_LABELS = ['Document scanned', 'Adding to account', 'Uploading photos', 'Verifying document'];
const STEP_DETAILS = [
  'Captured on this device',
  'Saving it to your documents',
  'Sending your scan securely',
  'Checking authenticity & extracting details',
];
const STEP_INDEX: Record<ProcessingStatus, number> = {
  adding: 1,
  uploading: 2,
  verifying: 3,
  done: 4,
  error: -1,
};

const STATUS_LINE: Record<ProcessingStatus, string> = {
  adding: 'Adding document…',
  uploading: 'Uploading photos…',
  verifying: 'Verifying document…',
  done: 'Verified!',
  error: 'Verification failed',
};

/** Readable text for a thrown network/API error (not a verify rejection). */
const errorText = (err: unknown): string => {
  const e = toApiError(err);
  // axios → NETWORK; the presigned PUT uses fetch → "Network request failed".
  if (e.code === 'NETWORK' || /network request failed|failed to fetch/i.test(e.message)) {
    return "Couldn't reach the server. Check your internet connection and tap Retry.";
  }
  return e.message || 'Verification failed';
};

/** Document processing (BACKEND_UPDATE_2026-10 §6.2–6.5):
 *  1. POST /documents (no number — the server reads it from the scan)
 *  2. presigned upload of the captured image(s)
 *  3. verification session with the object keys → /verify (synchronous)
 *  4. approved → verified screen; rejected → reasonMessage + one action. */
export default function DocumentProcessingScreen() {
  const router = useRouter();
  const { type, label, expiresAt } = useLocalSearchParams<{
    type?: string;
    label?: string;
    expiresAt?: string;
  }>();
  const docType = (type ?? 'passport') as DocumentType;
  const meta = docMeta(docType);
  const docLabel = label?.trim() || meta.label;
  const docExpiresAt = expiresAt?.trim() || null;
  const [status, setStatus] = useState<ProcessingStatus>('adding');
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const processRef = useRef<(() => Promise<void>) | null>(null);
  // Document created by the current attempt — reused on Retry so a failed
  // upload/API error doesn't pile up duplicate documents.
  const createdDocRef = useRef<IdentityDocument | null>(null);
  const addDocument = useAddDocument();
  const queryClient = useQueryClient();
  const profileName = useAppSelector((state) => state.auth.user?.fullName ?? '');
  const profileDob = useAppSelector((state) => state.auth.user?.dateOfBirth ?? '');
  // Hero: the photo the user just captured (read once — the store is cleared
  // on completion). Display only; the upload reads the store in process().
  const [heroUri] = useState(() => {
    const s = getScanResult();
    const b64 = s?.documentPreviewBase64 ?? s?.documentImageBase64;
    return b64 ? `data:image/jpeg;base64,${b64}` : null;
  });

  // Staged flow — index tracks the real API step; on error it stays at the
  // last active step so that step renders as the failed one.
  const [stepIndex, setStepIndex] = useState(STEP_INDEX.adding);
  const goStep = (s: ProcessingStatus) => {
    setStatus(s);
    setStepIndex(STEP_INDEX[s]);
  };
  const onUploadStep = (s: VerifyUploadStep) => goStep(s === 'uploading' ? 'uploading' : 'verifying');

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const process = async () => {
      const scanResult = getScanResult();
      const frontImage = scanResult?.documentImageBase64 ?? '';

      if (!frontImage) {
        setError('No document image captured. Please scan again.');
        setStatus('error');
        clearScanResult();
        return;
      }

      try {
        // Step 1: add the document — metadata only, no number (§6.2).
        // On Retry, reuse the document created by the previous attempt.
        let doc = createdDocRef.current;
        if (!doc) {
          goStep('adding');
          doc = await addDocument.mutateAsync({
            type: docType,
            label: docLabel,
            expiresAt: docExpiresAt,
          });
          createdDocRef.current = doc;

          // Keep a local copy of the capture — the detail screen falls back
          // to it when the server has no image for this document.
          try {
            await saveDocumentImages(doc.id, {
              front: scanResult?.documentPreviewBase64 ?? frontImage,
              back: scanResult?.backImageBase64,
              selfie: scanResult?.selfieBase64,
            });
          } catch (e) {
            console.warn('[DocProcessing] Failed to save document images locally:', e);
          }
        }

        // Steps 2–3: presigned upload → session → verify (no base64).
        const result = await verifyDocumentWithUploads({
          documentId: doc.id,
          frontBase64: frontImage,
          backBase64: scanResult?.backImageBase64,
          onStep: onUploadStep,
        });

        clearScanResult();

        if (isApproved(result)) {
          // One per type (§6.5): the server removed older VERIFIED documents of
          // this type. Unverified leftovers of the same type (earlier failed or
          // pending attempts) are now noise — remove them too (best effort).
          try {
            const existing = await api.getDocuments();
            const leftovers = (existing ?? []).filter(
              (d) => d.type === docType && d.id !== doc.id && d.status !== 'verified',
            );
            for (const old of leftovers) {
              try {
                await api.removeDocument(old.id);
                await clearDocumentImages(old.id);
              } catch (e) {
                console.warn('[DocProcessing] Failed to remove leftover document:', old.id, e);
              }
            }
          } catch (e) {
            console.warn('[DocProcessing] Leftover lookup failed:', e);
          }

          refreshAfterVerify(queryClient, doc.id);
          goStep('done');
          flowGuards.grant('document:verified');
          router.replace({
            pathname: '/document/verified',
            params: {
              docId: doc.id,
              docLabel,
              docType,
              // The POST-VERIFY number (masked, read from the document).
              docNumber: result.document?.number ?? '',
              extractedName: result.extractedName ?? '',
              extractedDob: result.extractedDob ?? '',
              matchScore: result.matchScore != null ? String(result.matchScore) : '',
              issuingState: result.issuingState ?? '',
              nationality: result.nationality ?? '',
              dateOfExpiry: result.dateOfExpiry ?? '',
              portraitImageUrl: result.portraitImageUrl ?? '',
            },
          });
          return;
        }

        // Rejected. A VERIFIED document of this type stays the only one, so
        // this failed attempt is discarded. Otherwise this attempt is the one
        // worth keeping (it has the reason and what was read) — older
        // unverified ones of the type (e.g. the old "PENDING" placeholders)
        // are removed instead.
        try {
          const sameType = (await api.getDocuments() ?? []).filter((d) => d.type === docType && d.id !== doc.id);
          const stale = sameType.some((d) => d.status === 'verified') ? [doc] : sameType;
          for (const old of stale) {
            try {
              await api.removeDocument(old.id);
              await clearDocumentImages(old.id);
              if (old.id === doc.id) createdDocRef.current = null;
            } catch (e) {
              console.warn('[DocProcessing] Failed to remove document:', old.id, e);
            }
          }
        } catch (e) {
          console.warn('[DocProcessing] Failed-attempt cleanup error:', e);
        }
        refreshAfterVerify(queryClient, doc.id);

        if (result.reasonCode === 'PROFILE_MISMATCH') {
          // Name/DOB differ from the profile — compare them and offer to update.
          flowGuards.grant('document:mismatch');
          router.replace({
            pathname: '/document/mismatch',
            params: {
              docType,
              profileName,
              profileDob,
              docName: result.extractedName ?? '',
              docDob: result.extractedDob ?? '',
              reasonMessage: result.reasonMessage ?? '',
            },
          });
          return;
        }

        flowGuards.grant('document:rejected');
        router.replace({
          pathname: '/document/rejected',
          params: {
            docType,
            docLabel,
            reasonCode: result.reasonCode ?? '',
            reasonMessage: result.reasonMessage ?? '',
          },
        } as never);
      } catch (err) {
        // Network/API failure (not a rejection): stay here with Retry. Keep
        // the scan — Retry re-uploads the same capture.
        const msg = errorText(err);
        // warn, not error: this is handled (Retry is on screen), so it
        // shouldn't open the dev error overlay. The endpoint, status and
        // trace id are what the backend team needs for a report.
        const apiErr = toApiError(err);
        const url = (err as { config?: { method?: string; url?: string } })?.config;
        console.warn('[DocProcessing] Failed:', msg, {
          endpoint: url?.url ? `${url.method?.toUpperCase() ?? ''} ${url.url}` : undefined,
          status: apiErr.status,
          code: apiErr.code,
          traceId: apiErr.traceId,
        });
        setError(msg);
        setStatus('error');
      }
    };

    processRef.current = process;
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType]);

  const retry = () => {
    setError(null);
    goStep('adding');
    processRef.current?.();
  };

  const backToDocuments = () => {
    // Discard the unverified document created by this attempt so no pending
    // duplicate is left in the wallet.
    const doc = createdDocRef.current;
    if (doc) {
      api.removeDocument(doc.id).catch(() => {});
      clearDocumentImages(doc.id).catch(() => {});
      createdDocRef.current = null;
    }
    router.back();
  };

  const failed = status === 'error';
  // Index-driven steps: before index → done, at index → active (failed on
  // error), after → pending.
  const steps = STEP_LABELS.map((l, i) => {
    const state: FlowStepState = i < stepIndex ? 'done' : i === stepIndex ? (failed ? 'failed' : 'active') : 'todo';
    return { label: l, detail: STEP_DETAILS[i], state };
  });

  return (
    <Screen
      header={<TopBar title="Verifying" hideBack={!failed} onBack={backToDocuments} />}
      contentStyle={{ paddingTop: 8 }}
      footer={
        failed ? (
          <>
            <Button label="Retry verification" icon={RotateCcw} onPress={retry} />
            <Button label="Back to documents" tone="white" onPress={backToDocuments} />
          </>
        ) : undefined
      }>
      <View style={{ alignItems: 'center', paddingTop: 6 }}>
        {heroUri ? (
          <ScanHero uri={heroUri} scanning={!failed && status !== 'done'} />
        ) : (
          <DocumentCard
            type={docType}
            label={docLabel}
            height={180}
            badge={failed ? { label: 'Failed', tone: 'red', dot: true } : { label: 'Checking', tone: 'amber', dot: true }}
            style={{ width: 300, transform: [{ rotate: '-4deg' }] }}
          />
        )}
      </View>

      <View style={{ gap: 12, alignItems: 'center' }}>
        <View accessibilityLiveRegion="polite">
          <Txt v="micro" color={failed ? C.redInk : C.sky} center>
            {STATUS_LINE[status]}
          </Txt>
        </View>
        {failed ? (
          <Heading title="Verification" accent="failed." sub="Retry with the same scan, or go back to your documents." center />
        ) : (
          <Heading
            title="Checking your"
            accent={`${meta.noun}.`}
            sub={status === 'verifying' ? 'Reading your document — this may take a moment.' : 'Extracting details & matching your face.'}
            center
          />
        )}
      </View>

      <StepList steps={steps} />

      {error ? <Banner tone="error" title="Something went wrong" body={error} /> : null}

      <Row gap={8} style={{ justifyContent: 'center' }}>
        <ShieldCheck size={15} color={C.ink3} />
        <Txt v="small">Sent over an encrypted connection</Txt>
      </Row>
    </Screen>
  );
}
