/** @jsxImportSource react */
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RotateCcw, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { documentKeys, useAddDocument } from '@/features/documents/hooks';
import { DocumentCard, docMeta, ScanHero, StepList, type FlowStepState } from '@/premium/flows/documents';
import { Banner } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Row, Screen, TopBar, Txt } from '@/premium/ui';
import { clearDocumentImages, saveDocumentImages } from '@/services/documentImageStore';
import { flowGuards } from '@/services/flowGuards';
import { clearScanResult, getScanResult } from '@/services/scanStore';
import { useAppSelector } from '@/store';
import type { DocumentType, IdentityDocument } from '@/types/domain';

const DOC_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  drivingLicense: "Driver's License",
  idCard: 'ID Card',
  greenCard: 'US Green Card',
  birthCertificate: 'Birth Certificate',
  usVisa: 'U.S. Visa',
};

type ProcessingStatus = 'adding' | 'creating_session' | 'verifying' | 'done' | 'error';

const STEP_LABELS = ['Document scanned', 'Adding to account', 'Creating session', 'Verifying document'];
const STEP_DETAILS = [
  'Captured on this device',
  'Saving it to your documents',
  'Opening a secure verification',
  'Checking authenticity & extracting details',
];
const STEP_INDEX: Record<ProcessingStatus, number> = {
  adding: 1,
  creating_session: 2,
  verifying: 3,
  done: 4,
  error: -1,
};

const STATUS_LINE: Record<ProcessingStatus, string> = {
  adding: 'Adding document…',
  creating_session: 'Creating verification session…',
  verifying: 'Verifying document…',
  done: 'Verified!',
  error: 'Verification failed',
};

/** Extract a readable message from any thrown error. */
const msg0 = (err: any): string =>
  // No response at all (offline / dropped connection) — axios only says "Network Error".
  err?.request && !err?.response
    ? "Couldn't reach the server. Check your internet connection and tap Retry."
    : (err?.response?.data?.message ?? err?.message ?? 'Verification failed');

/** Document processing — per REACT_NATIVE_KYC_INTEGRATION_GUIDE.md §6:
 *  1. POST /documents → documentId
 *  2. POST /documents/{id}/verification-sessions → sessionId
 *  3. POST /document-verification-sessions/{sessionId}/verify
 *     with { frontImageBase64, selfieImageBase64? } → SYNCHRONOUS result
 *  4. No polling needed — verify returns final outcome directly */
export default function DocumentProcessingScreen() {
  const router = useRouter();
  const { type, label, number, expiresAt } = useLocalSearchParams<{
    type?: string;
    label?: string;
    number?: string;
    expiresAt?: string;
  }>();
  const docType = (type ?? 'passport') as DocumentType;
  // Metadata collected on the add-document form — falls back to the type
  // label / 'PENDING' placeholder when reached without it (deep links).
  const docLabel = label?.trim() || DOC_LABELS[docType];
  const docNumber = number?.trim() || 'PENDING';
  const docExpiresAt = expiresAt?.trim() || null;
  const [status, setStatus] = useState<ProcessingStatus>('adding');
  const [error, setError] = useState<string | null>(null);
  const hasStarted = useRef(false);
  const processRef = useRef<(() => Promise<void>) | null>(null);
  // Document created by the current attempt — reused on Retry so a failed
  // session/API error doesn't pile up duplicate documents.
  const createdDocRef = useRef<IdentityDocument | null>(null);
  const addDocument = useAddDocument();
  const queryClient = useQueryClient();
  const profileName = useAppSelector((state) => state.auth.user?.fullName ?? 'User');
  const profileDob = useAppSelector((state) => state.auth.user?.dateOfBirth ?? '');
  // Hero: the photo the user just captured (read once — the store is cleared
  // on success). Display only; the upload still reads the store in process().
  const [heroUri] = useState(() => {
    const s = getScanResult();
    const b64 = s?.documentPreviewBase64 ?? s?.documentImageBase64;
    return b64 ? `data:image/jpeg;base64,${b64}` : null;
  });

  // Staged flow — index tracks the real API step; on error it stays at the
  // last active step so that step renders as the failed one.
  const [stepIndex, setStepIndex] = useState(STEP_INDEX.adding);

  // Refresh document lists + identity summary AFTER verification completes —
  // the addDocument invalidation fires while the doc is still `pending`, so
  // without this the list shows a stale pre-verify status (e.g. "Failed").
  const refreshDocumentCaches = () => {
    queryClient.invalidateQueries({ queryKey: documentKeys.all });
    queryClient.invalidateQueries({ queryKey: ['identity'] });
  };

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const process = async () => {
      const scanResult = getScanResult();
      const frontImage = scanResult?.documentImageBase64 ?? '';
      const selfieImage = scanResult?.selfieBase64;

      if (!frontImage) {
        setError('No document image captured. Please scan again.');
        setStatus('error');
        clearScanResult();
        return;
      }

      try {
        // Step 1: Add document (metadata only — backend will fill in extracted data).
        // On Retry, reuse the document created by the previous attempt.
        // NOTE: `number` is a required backend field (min 2 chars) but the real
        // number comes from server-side OCR during /verify — never fabricate a
        // random one here. "PENDING" is overwritten by the backend after verify.
        let doc = createdDocRef.current;
        if (!doc) {
          setStatus('adding');
          setStepIndex(STEP_INDEX.adding);
          doc = await addDocument.mutateAsync({
            type: docType,
            label: docLabel,
            number: docNumber,
            expiresAt: docExpiresAt,
          });
          createdDocRef.current = doc;

          // Persist captured images locally so the document detail screen
          // can show the originally captured photo later.
          try {
            await saveDocumentImages(doc.id, {
              front: scanResult?.documentPreviewBase64 ?? frontImage,
              selfie: selfieImage,
            });
          } catch (e) {
            console.warn('[DocProcessing] Failed to save document images locally:', e);
          }
        }

        // Step 2: Create verification session (requestId = idempotency key)
        // Per guide §6.3: omit frontObjectKey/backObjectKey/selfieObjectKey —
        // they are reserved for the future signed-upload pipeline and the BFF
        // rejects keys not starting with customers/{customerId}/.
        setStatus('creating_session');
        setStepIndex(STEP_INDEX.creating_session);
        const session = await api.createVerificationSession(doc.id, {
          requestId: `req-${Date.now()}`,
        });

        // Step 3: Verify — SYNCHRONOUS result with images as base64
        // Per guide §6.3: frontImageBase64 is required, selfieImageBase64 for face match
        setStatus('verifying');
        setStepIndex(STEP_INDEX.verifying);
        const result = await api.startVerificationWithImages(
          session.id,
          {
            frontImageBase64: frontImage,
            selfieImageBase64: selfieImage,
          },
          { timeout: 90_000 } // Regula processing can take a while
        );

        clearScanResult();

        // Step 4: Handle outcome — verify is synchronous, no polling
        if (result.outcome === 'approved' || result.outcome === 'review') {
          // Facepe-style REPLACE: the new document is verified, so remove any
          // previous document of the same type for the main user. GET /documents
          // (self) is already scoped to the account owner by the BFF, so a
          // plain type match is enough — do NOT filter on !personId (the
          // backend fills personId on self docs too, which silently disabled
          // this cleanup and let duplicates pile up).
          try {
            const existing = await api.getDocuments();
            const duplicates = (existing ?? []).filter(
              (d) => d.type === docType && d.id !== doc.id,
            );
            for (const dup of duplicates) {
              try {
                await api.removeDocument(dup.id);
                await clearDocumentImages(dup.id);
                console.log('[DocProcessing] Replaced existing document:', dup.id, dup.type);
              } catch (e) {
                console.warn('[DocProcessing] Failed to remove duplicate:', dup.id, e);
              }
            }
          } catch (e) {
            console.warn('[DocProcessing] Replace lookup failed — keeping existing documents:', e);
          }

          refreshDocumentCaches();
          setStatus('done');
          setStepIndex(STEP_INDEX.done);
          // Pass backend-returned extracted data to the verified screen.
          // docNumber comes from the POST-VERIFY document (real masked number),
          // not the pre-verify placeholder.
          flowGuards.grant('document:verified');
          router.replace({
            pathname: '/document/verified',
            params: {
              docId: doc.id,
              docLabel,
              docType,
              docNumber: result.document?.number ?? doc.number ?? '',
              extractedName: result.extractedName ?? '',
              extractedDob: result.extractedDob ?? '',
              matchScore: result.matchScore != null ? String(result.matchScore) : '',
              outcome: result.outcome,
              issuingState: result.issuingState ?? '',
              nationality: result.nationality ?? '',
              dateOfExpiry: result.dateOfExpiry ?? '',
              portraitImageUrl: result.portraitImageUrl ?? '',
            },
          });
        } else {
          setStatus('error');
          setError(result.reasonCode ?? 'Document verification failed');

          // Verification rejected — if the user already has a document of this
          // type, discard the failed attempt so the old document survives
          // (Facepe-style replace never leaves a failed duplicate behind).
          try {
            const existing = await api.getDocuments();
            const hasExisting = (existing ?? []).some(
              (d) => d.type === docType && d.id !== doc.id,
            );
            if (hasExisting) {
              await api.removeDocument(doc.id);
              await clearDocumentImages(doc.id);
              createdDocRef.current = null;
              console.log('[DocProcessing] Discarded failed re-upload, existing document kept');
            }
          } catch (e) {
            console.warn('[DocProcessing] Failed-attempt cleanup error:', e);
          }

          refreshDocumentCaches();
          flowGuards.grant('document:mismatch');
          router.replace({
            pathname: '/document/mismatch',
            params: {
              docId: doc.id,
              profileName,
              profileDob,
              docName: result.extractedName ?? '',
              docDob: result.extractedDob ?? '',
              reason: result.reasonCode ?? '',
            },
          });
        }
      } catch (err: any) {
        // Keep scanResult — Retry re-runs with the same captured images.
        // Clearing it here made every Retry fail with "No document image
        // captured". It's cleared on success or overwritten by the next scan.
        const msg = msg0(err);
        console.error('[DocProcessing] Failed at step:', status, '|', msg, JSON.stringify(err?.response?.data));
        setError(msg);
        setStatus('error');
        // Stay on this screen with a Retry button — do NOT route to mismatch.
        // Mismatch is only for real verification outcomes (rejected/mismatch),
        // not for HTTP/API errors like 404 or 5xx.
      }
    };

    processRef.current = process;
    process();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docType]);

  const retry = () => {
    hasStarted.current = false;
    setError(null);
    setStatus('adding');
    setStepIndex(STEP_INDEX.adding);
    processRef.current?.();
  };

  const backToDocuments = () => {
    // Discard the unverified document created by this attempt so
    // no pending duplicate is left in My Documents.
    const doc = createdDocRef.current;
    if (doc) {
      api.removeDocument(doc.id).catch(() => {});
      clearDocumentImages(doc.id).catch(() => {});
      createdDocRef.current = null;
    }
    router.back();
  };

  const failed = status === 'error';
  const meta = docMeta(docType);
  // Index-driven steps: before index → done, at index → active (failed on
  // error), after → pending.
  const steps = STEP_LABELS.map((l, i) => {
    const state: FlowStepState =
      i < stepIndex ? 'done' : i === stepIndex ? (failed ? 'failed' : 'active') : 'todo';
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
