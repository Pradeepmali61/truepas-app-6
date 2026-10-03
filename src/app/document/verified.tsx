/** @jsxImportSource react */
import { Image } from 'expo-image';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, FileText, RotateCcw, ScanFace, TriangleAlert } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { DocumentCard, FlipCard, MatchRing } from '@/premium/flows/documents';
import { C } from '@/premium/theme';
import { Button, Group, ListRow, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';
import { getDocumentImageUri } from '@/services/documentImageStore';
import { flowGuards } from '@/services/flowGuards';

function formatUSDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
}

/** Document verified success — flip card design (ref: facepe-user-frontend verify.tsx).
 *  Front face: premium credential card (label, number, holder, expiry).
 *  Back face: the captured document scan image.
 *  Flip button toggles between "View scan" and "View info". */
export default function DocumentVerifiedScreen() {
  const router = useRouter();
  const {
    docId,
    docLabel,
    docType,
    docNumber,
    extractedName,
    extractedDob,
    matchScore,
    outcome,
    issuingState,
    nationality,
    dateOfExpiry,
    portraitImageUrl,
  } = useLocalSearchParams<{
    docId?: string;
    docLabel?: string;
    docType?: string;
    docNumber?: string;
    extractedName?: string;
    extractedDob?: string;
    matchScore?: string;
    outcome?: string;
    issuingState?: string;
    nationality?: string;
    dateOfExpiry?: string;
    portraitImageUrl?: string;
  }>();

  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [selfieImageUri, setSelfieImageUri] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  // Result screen — a deep link with no real verification behind it must not
  // render a fake "verified" card (ADV-001).
  const [allowed] = useState(() => flowGuards.has('document:verified'));

  useEffect(() => {
    if (allowed) flowGuards.consume('document:verified');
  }, [allowed]);

  useEffect(() => {
    // Captured images were persisted locally (keyed by docId) before verification
    if (docId) {
      getDocumentImageUri(docId, 'front').then(setFrontImageUri).catch(() => setFrontImageUri(null));
      getDocumentImageUri(docId, 'selfie').then(setSelfieImageUri).catch(() => setSelfieImageUri(null));
    }
  }, [docId]);

  // Binary outcome (like DL): approved → VERIFIED, everything else (review,
  // manual_review, rejected) → FAILED. No intermediate "review" state in UI.
  const isFailed = outcome !== 'approved';
  const title = docLabel ?? 'Document';
  // Prefer the real doc type (passed from processing); fall back to the label
  // heuristic for direct navigation without the param.
  const isLicense = (docType ?? docLabel ?? '').toLowerCase().includes('license');
  // matchScore arrives 0–1 from the BFF; the ring renders a percentage.
  const confidencePct =
    matchScore && !isFailed
      ? (() => {
          const n = parseFloat(matchScore);
          if (Number.isNaN(n)) return null;
          return Math.round(n <= 1 ? n * 100 : n);
        })()
      : null;

  if (!allowed) return <Redirect href="/document/select-type" />;

  const portraitUri = portraitImageUrl || selfieImageUri;

  return (
    <ResultView
      close
      icon={isFailed ? TriangleAlert : Check}
      tone={isFailed ? 'red' : 'green'}
      over={isFailed ? 'Verification failed' : 'Verification complete'}
      title={isFailed ? "Couldn't verify" : title}
      accent={isFailed ? 'this document.' : 'verified.'}
      sub={
        isFailed
          ? 'We could not verify this document. Please scan it again.'
          : 'Your document has been verified successfully.'
      }
      primary={
        <Button label="Go to identity dashboard" onPress={() => router.dismissTo('/identity' as never)} />
      }
      secondary={
        isFailed ? (
          <Button label="Scan again" tone="ghost" icon={RotateCcw} onPress={() => router.dismissTo('/document/select-type' as never)} />
        ) : (
          <Button label="Add another document" tone="ghost" onPress={() => router.dismissTo('/document/select-type' as never)} />
        )
      }>
      {/* Flip card — front: credential card / back: captured scan */}
      <View style={{ gap: 14, alignItems: 'center' }}>
        <FlipCard
          flipped={isFlipped}
          height={200}
          scanUri={frontImageUri}
          style={{ alignSelf: 'stretch' }}
          front={
            <DocumentCard
              type={docType || (isLicense ? 'drivingLicense' : 'passport')}
              label={title}
              number={docNumber || '—'}
              status={isFailed ? 'failed' : 'verified'}
              holder={extractedName || null}
              expiresAt={dateOfExpiry ? dateOfExpiry.split('T')[0] : null}
              issuer={(isLicense ? issuingState : nationality) || null}
              height={200}
            />
          }
        />
        <Button
          size="sm"
          tone="white"
          full={false}
          icon={isFlipped ? FileText : Camera}
          label={isFlipped ? 'View info' : 'View scan'}
          onPress={() => setIsFlipped((f) => !f)}
        />
      </View>

      {/* Extracted fields — portrait + captured data */}
      <Group title="Read from your document">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
          {/* Portrait — from backend (portraitImageUrl, extracted by server-side Regula)
           *  → selfie fallback → icon placeholder */}
          <View
            style={{
              width: 56,
              height: 68,
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: C.sunken,
              borderWidth: 1,
              borderColor: C.lineSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {portraitUri ? (
              <Image source={{ uri: portraitUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel="Document portrait" />
            ) : (
              <ScanFace size={24} color={C.ink4} />
            )}
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Txt v="micro">Full name</Txt>
            <Txt v="bodyStrong" lines={2}>
              {extractedName || '—'}
            </Txt>
          </View>
        </View>
        <ListRow title="Document no." value={docNumber || '—'} chevron={false} />
        <ListRow title="Date of birth" value={formatUSDate(extractedDob)} chevron={false} />
        {isLicense && !dateOfExpiry ? null : (
          <ListRow title="Expires" value={formatUSDate(dateOfExpiry)} chevron={false} />
        )}
        <ListRow
          title={isLicense ? 'State' : 'Nationality'}
          value={isLicense ? issuingState || '—' : nationality || '—'}
          chevron={false}
        />
      </Group>

      {confidencePct != null && <MatchRing value={confidencePct} sub="Returned by document verification" />}
    </ResultView>
  );
}
