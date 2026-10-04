/** @jsxImportSource react */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { RotateCcw, TriangleAlert, Users } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '@/api';
import { useAddDocument } from '@/features/documents/hooks';
import { ageFromDob, findMatchingMember, isDuplicateMemberError, useAddFamilyMember } from '@/features/family/hooks';
import { FaceRing, Medallion } from '@/premium/blocks';
import { StepCard, stagedSteps } from '@/premium/flows/family';
import { Banner } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Footer, Heading, TopBar } from '@/premium/ui';
import { clearDocumentImages, saveDocumentImages } from '@/services/documentImageStore';
import { clearScanResult, getScanResult } from '@/services/scanStore';
import type { DocumentType, FamilyMember, IdentityDocument } from '@/types/domain';

type ProcessingStatus = 'adding' | 'done' | 'error';

const DOC_LABELS: Record<DocumentType, string> = {
  passport: 'Passport',
  drivingLicense: "Driver's License",
  idCard: 'ID Card',
  greenCard: 'US Green Card',
  birthCertificate: 'Birth Certificate',
  usVisa: 'U.S. Visa',
};

/** Family document processing — runs AFTER document capture.
 *  Two modes:
 *  - personId present (existing member): adds the captured document to that
 *    member's profile, then pops back to the member detail page (no face
 *    step — adding an extra document never re-runs face capture).
 *  - no personId (new member): creates the family member, then:
 *    - 5+: routes to face-capture (liveness + face enrollment), which
 *      then routes to the member detail page on completion.
 *    - 0-4:  routes to photo-capture (photo enrollment, no liveness), which
 *      then routes to the member detail page on completion. */
export default function FamilyProcessingScreen() {
  const router = useRouter();
  const { type, personId, name, dob, relationship, band } = useLocalSearchParams<{
    type?: string;
    personId?: string;
    name?: string;
    dob?: string;
    relationship?: string;
    band?: string;
  }>();
  const isExistingMember = !!personId;
  const docType = (type ?? 'passport') as DocumentType;
  const needsFace = band !== '0-4';
  const [status, setStatus] = useState<ProcessingStatus>('adding');
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(true);
  // Staged flow — index advances at each real await boundary inside process().
  const [stepIndex, setStepIndex] = useState(0);
  const STEP_LABELS = isExistingMember
    ? ['Document captured', 'Adding document', 'Verifying document']
    : ['Creating member profile', 'Adding document', 'Verifying document'];
  const processRef = useRef<(() => Promise<void>) | null>(null);
  const addFamilyMember = useAddFamilyMember();
  const addDocument = useAddDocument();
  // Retry-safe: created entities are reused so a retry after a verify
  // failure doesn't mint duplicate members/documents.
  const createdMemberRef = useRef<FamilyMember | null>(null);
  const createdDocRef = useRef<IdentityDocument | null>(null);

  /** Verify a member document — same pipeline as self-docs (session +
   *  front-image verify, no selfie: the member's face is captured later).
   *  Best-effort: the backend verification service may be unavailable or
   *  may not verify member docs — a captured doc still counts as added
   *  (family/[id] treats any non-failed doc as done). */
  const verifyMemberDoc = async (docId: string, frontImageBase64: string) => {
    try {
      const session = await api.createVerificationSession(docId, {
        requestId: `req-${Date.now()}`,
      });
      const result = await api.startVerificationWithImages(
        session.id,
        { frontImageBase64 },
        { timeout: 90_000 },
      );
      console.log('[FamilyAdd] Member doc verify outcome:', result.outcome, result.reasonCode ?? '');
    } catch (e: any) {
      console.warn('[FamilyAdd] Member doc verification unavailable — continuing:', e?.message);
    }
  };

  /** Facepe-style REPLACE: the member's previous document of this type is
   *  superseded by the new capture — remove the old one so repeat scans
   *  don't pile up in the member's document list. */
  const replaceOlderDocs = async (memberId: string, keepDocId: string) => {
    try {
      const existing = await api.getDocuments(memberId);
      const duplicates = (existing ?? []).filter(
        (d) => d.type === docType && d.id !== keepDocId,
      );
      for (const dup of duplicates) {
        try {
          await api.removeDocument(dup.id);
          await clearDocumentImages(dup.id);
          console.log('[FamilyAdd] Replaced existing member document:', dup.id, dup.type);
        } catch (e) {
          console.warn('[FamilyAdd] Failed to remove duplicate:', dup.id, e);
        }
      }
    } catch (e) {
      console.warn('[FamilyAdd] Replace lookup failed — keeping existing documents:', e);
    }
  };

  /** A member with the same name + DOB already on the account — e.g. an
   *  earlier attempt whose liveness failed and the user restarted "Add
   *  family member". Reusing it stops every retry minting a duplicate. */
  const findExistingMember = async (): Promise<FamilyMember | null> => {
    if (!name || !dob) return null;
    try {
      return findMatchingMember(await api.getFamily(), name, dob);
    } catch (e) {
      console.warn('[FamilyAdd] Existing-member lookup failed — creating new:', e);
      return null;
    }
  };

  const process = async () => {
    try {
      setStatus('adding');
      setStepIndex(0);

      if (isExistingMember) {
        // Existing member — attach the captured document to their profile
        const scanResult = getScanResult();
        if (!scanResult?.documentImageBase64) {
          throw new Error('No document image captured. Please scan again.');
        }
        console.log('[FamilyAdd] Adding document to member:', personId, docType);
        let doc = createdDocRef.current;
        if (!doc) {
          setStepIndex(1);
          doc = await addDocument.mutateAsync({
            type: docType,
            label: DOC_LABELS[docType],
            number: 'PENDING',
            expiresAt: null,
            personId,
          });
          createdDocRef.current = doc;
        }
        console.log('[FamilyAdd] Document created:', JSON.stringify({ id: doc.id, personId: doc.personId, type: doc.type, label: doc.label }));
        await replaceOlderDocs(personId, doc.id);
        // Persist captured image locally so it can be shown in document detail
        try {
          await saveDocumentImages(doc.id, {
            front: scanResult.documentPreviewBase64 ?? scanResult.documentImageBase64,
            selfie: scanResult.selfieBase64,
          });
        } catch (e) {
          console.warn('[FamilyAdd] Failed to save document images locally:', e);
        }
        console.log('[FamilyAdd] Document added for member:', personId, '| doc.personId=', doc.personId);
        setStepIndex(2);
        await verifyMemberDoc(doc.id, scanResult.documentImageBase64);
        clearScanResult();
        setStatus('done');
        // Existing member (Continue setup / "Add a document"): never runs
        // face capture here — the member page owns that step, so a member
        // whose face is already enrolled just gets the extra document. Pop
        // back to the member page that started this flow (select-type stays
        // off the back stack); replaces this screen if it isn't there.
        router.dismissTo({ pathname: '/family/[id]', params: { id: personId } });
        return;
      }

      if (!name || !dob || !relationship) {
        router.dismissTo('/(tabs)');
        return;
      }
      console.log('[FamilyAdd] Creating member:', JSON.stringify({ name, dob, relationship, band }));
      let member = createdMemberRef.current;
      let reused = false;
      if (!member) {
        member = await findExistingMember();
        reused = !!member;
        if (!member) {
          member = await addFamilyMember.mutateAsync({ name, dateOfBirth: dob, relationship });
        }
        createdMemberRef.current = member;
      }
      console.log(reused ? '[FamilyAdd] Reusing existing member:' : '[FamilyAdd] Member created:', member.id);

      // Attach the captured document to the newly created member
      const scanResult = getScanResult();
      let doc = createdDocRef.current;
      if (scanResult?.documentImageBase64 && !doc) {
        setStepIndex(1);
        console.log('[FamilyAdd] Adding document to new member:', member.id, docType);
        doc = await addDocument.mutateAsync({
          type: docType,
          label: DOC_LABELS[docType],
          number: 'PENDING',
          expiresAt: null,
          personId: member.id,
        });
        createdDocRef.current = doc;
        console.log('[FamilyAdd] Document created:', JSON.stringify({ id: doc.id, personId: doc.personId, type: doc.type }));
        if (reused) await replaceOlderDocs(member.id, doc.id);
        try {
          await saveDocumentImages(doc.id, {
            front: scanResult.documentPreviewBase64 ?? scanResult.documentImageBase64,
            selfie: scanResult.selfieBase64,
          });
        } catch (e) {
          console.warn('[FamilyAdd] Failed to save document images locally:', e);
        }
      }

      if (doc && scanResult?.documentImageBase64) {
        setStepIndex(2);
        await verifyMemberDoc(doc.id, scanResult.documentImageBase64);
      }

      clearScanResult();
      setStatus('done');
      if (needsFace) {
        // 5+: liveness + face enrollment, then route to member detail page.
        // `age` lets face-capture enable the back camera for under-10 members.
        router.replace({
          pathname: '/family/add/face-capture',
          params: { name: name.split(' ')[0], personId: member.id, age: String(ageFromDob(dob)) },
        });
      } else {
        // 0-4: can't run liveness — photo enrollment captures one photo
        // (selfieBase64 + personId), then routes to the member detail page.
        router.replace({
          pathname: '/family/add/photo-capture',
          params: { name: name.split(' ')[0], age: String(ageFromDob(dob)), personId: member.id },
        });
      }
    } catch (err: any) {
      // Keep scanResult on failure — Retry re-runs the verify step and
      // still needs the captured image. It's cleared on success or
      // overwritten by the next capture.
      const msg = err?.response?.data?.message ?? err?.message ?? 'Could not add family member';
      console.error('[FamilyAdd] Failed:', msg, JSON.stringify(err?.response?.data));
      if (isDuplicateMemberError(err)) {
        // Backend says this member exists but our lookup missed it — try once
        // more and hand the user to that member instead of a dead-end error.
        const match = await findExistingMember();
        if (match) {
          router.replace({ pathname: '/family/[id]', params: { id: match.id } });
          return;
        }
        // Not in the list (e.g. removed earlier but still held by the backend).
        setRetryable(false);
        setError(
          `${name ?? 'This member'} was added to your account before. Check your Family list, or contact support if they were removed.`,
        );
        setStatus('error');
        return;
      }
      // Retry only helps when the request never got an answer or the server
      // failed — not for validation/duplicate rejections.
      const httpStatus = err?.response?.status;
      setRetryable(!err?.response || httpStatus >= 500 || httpStatus === 408 || httpStatus === 429);
      setError(msg);
      setStatus('error');
    }
  };

  useEffect(() => {
    processRef.current = process;
    // Defer to a microtask — process() updates state synchronously, which is
    // not allowed directly inside an effect (react-hooks/set-state-in-effect).
    queueMicrotask(process);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const first = (name ?? '').trim().split(' ')[0];
  const failed = status === 'error';
  const steps = stagedSteps(STEP_LABELS, status === 'done' ? STEP_LABELS.length : stepIndex, failed);
  const progress = Math.min(1, Math.max(0.12, (status === 'done' ? STEP_LABELS.length : stepIndex + 0.5) / STEP_LABELS.length));

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <TopBar hideBack title={isExistingMember ? 'Add document' : 'Add member'} />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 26, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center', paddingTop: 6 }}>
            {failed ? (
              <Medallion icon={TriangleAlert} tone="red" size={76} />
            ) : (
              <FaceRing size={170} photo={false} mode={status === 'done' ? 'success' : 'scan'} progress={progress} />
            )}
          </View>
          <View accessibilityLiveRegion="polite">
            {status === 'adding' && (
              <Heading
                center
                title="Adding"
                accent={isExistingMember ? 'document…' : first ? `${first}…` : 'family member…'}
                sub={isExistingMember ? 'Saving the document to their profile…' : 'Creating profile…'}
              />
            )}
            {status === 'done' && (
              <Heading center title={isExistingMember ? 'Document' : 'Member'} accent="added." sub="Please wait" />
            )}
            {failed && <Heading center title="Couldn't add" accent={isExistingMember ? 'document.' : 'family member.'} />}
          </View>

          <StepCard steps={steps} />

          {error ? <Banner tone="error" body={error} /> : null}
        </ScrollView>

        {error ? (
          <Footer>
            {retryable && (
              <Button
                label="Retry"
                icon={RotateCcw}
                onPress={() => {
                  setError(null);
                  setStatus('adding');
                  processRef.current?.();
                }}
              />
            )}
            <Button
              label="Back to Family"
              tone={retryable ? 'white' : 'sky'}
              icon={Users}
              onPress={() => router.dismissTo('/(tabs)')}
            />
          </Footer>
        ) : null}
      </SafeAreaView>
    </View>
  );
}
