/** @jsxImportSource react */
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Camera,
    ChevronDown,
    ChevronRight,
    FileText,
    History,
    RefreshCw,
    ScanLine,
    Share2,
    ShieldCheck,
    Trash2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useDocument, useRemoveDocument } from '@/features/documents/hooks';
import { useToast } from '@/hooks/useToast';
import { DocumentCard, FlipCard, MatchRing, docMeta, matchPct, prettyDate, statusBadge } from '@/premium/flows/documents';
import { Async, Bone, ComingSoon, ConfirmSheet, EmptyView, SkeletonList, SoonOverlay } from '@/premium/kit';
import { C, R } from '@/premium/theme';
import { Badge, Button, Card, Group, ListRow, Row, Screen, TopBar, Txt } from '@/premium/ui';
import { getDocumentImageUri } from '@/services/documentImageStore';
import type { IdentityDocument } from '@/types/domain';

const CARD_H = 212;

function DetailSkeleton() {
  return (
    <View style={{ gap: 20 }}>
      <Bone h={CARD_H} r={R.xl} />
      <Row gap={10}>
        <Bone w="48%" h={48} r={24} />
        <Bone w="48%" h={48} r={24} />
      </Row>
      <SkeletonList rows={3} thumb={40} />
    </View>
  );
}

/** Document detail — a single identity document. Premium credential card
 *  (flips to the captured scan), verify card when a match score exists,
 *  detail rows with selective disclosure, Verify now / Remove actions. */
export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const toast = useToast();

  const docQuery = useDocument(id);
  const removeDocument = useRemoveDocument();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [scanImageUri, setScanImageUri] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  // Sensitive extracted fields stay hidden until asked for.
  const [showExtracted, setShowExtracted] = useState(false);

  // The backend doesn't return the captured photo — it's persisted locally
  // (keyed by docId) at scan time; flip the hero card to reveal it.
  useEffect(() => {
    if (!id) return;
    let alive = true;
    getDocumentImageUri(id, 'front')
      .then((uri) => {
        if (alive) setScanImageUri(uri);
      })
      .catch(() => {
        if (alive) setScanImageUri(null);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const status = docQuery.data?.status;
  const canVerify = status === 'pending' || status === 'failed';
  const removing = removeDocument.isPending;
  const doc = docQuery.data;

  // Re-verify re-captures via the scan flow (design pushes `docVerify`).
  const reverify = (d: IdentityDocument) =>
    router.push({
      pathname: '/document/scan',
      params: {
        type: d.type,
        label: d.label,
        number: d.number,
        expiresAt: d.expiresAt ?? undefined,
      },
    } as never);

  const doRemove = () => {
    if (!id) return;
    removeDocument.mutate(id, {
      onSuccess: () => {
        setConfirmRemove(false);
        toast.show('success', 'Document removed');
        router.back();
      },
      onError: (e) => {
        setConfirmRemove(false);
        toast.show('error', `Couldn't remove document${e instanceof Error ? `: ${e.message}` : ''}`);
      },
    });
  };

  return (
    <>
      <Screen
        header={<TopBar title={doc?.label ?? 'Document'} onBack={() => router.back()} />}
        contentStyle={{ paddingTop: 8 }}
        onRefresh={id ? () => void docQuery.refetch() : undefined}
        refreshing={docQuery.isRefetching}
        footer={
          doc != null && canVerify ? <Button label="Verify now" icon={ScanLine} onPress={() => reverify(doc)} /> : undefined
        }>
        <Async
          q={docQuery}
          skeleton={<DetailSkeleton />}
          emptyView={<EmptyView icon={FileText} title="Document not found" body="It may have been removed from your account." />}>
          {(d) => {
            const meta = docMeta(d.type);
            const pct = matchPct(d.matchScore);
            const expires = d.expiresAt ? d.expiresAt.split('T')[0] : null;
            const isLicense = d.type === 'drivingLicense';
            const badge = statusBadge(d.status);
            return (
              <>
                {/* Flip card — front: credential card / back: captured scan */}
                <View style={{ gap: 14 }}>
                  <FlipCard
                    flipped={isFlipped}
                    height={CARD_H}
                    scanUri={scanImageUri}
                    front={
                      <DocumentCard
                        type={d.type}
                        label={d.label}
                        number={d.number}
                        status={d.status}
                        holder={d.extractedName}
                        expiresAt={expires}
                        issuer={(isLicense ? d.issuingState : d.nationality) || null}
                        height={CARD_H}
                      />
                    }
                  />
                  <Row gap={10}>
                    <View style={{ flex: 1 }}>
                      <Button
                        label={isFlipped ? 'View info' : 'View scan'}
                        icon={isFlipped ? FileText : Camera}
                        tone="white"
                        size="md"
                        onPress={() => setIsFlipped((f) => !f)}
                      />
                    </View>
                    {/* Sharing a document has no backend yet. */}
                    <View style={{ flex: 1 }} accessible accessibilityLabel="Share" accessibilityHint="Coming soon" accessibilityState={{ disabled: true }}>
                      <View pointerEvents="none" style={{ opacity: 0.5 }}>
                        <Button label="Share" icon={Share2} size="md" />
                      </View>
                      <View pointerEvents="none" style={{ position: 'absolute', top: -12, right: 6 }}>
                        <ComingSoon />
                      </View>
                    </View>
                  </Row>
                </View>

                {/* Verify card — match score + re-verify (only when a score exists) */}
                {pct != null && (
                  <MatchRing
                    value={pct}
                    label="Document match"
                    sub={`${meta.label} · added ${prettyDate(d.addedAt)}`}
                    right={<Badge label={badge.label} tone={badge.tone} icon={badge.icon} dot={badge.dot} />}>
                    <Button label="Re-verify" icon={RefreshCw} tone="soft" size="md" onPress={() => reverify(d)} />
                  </MatchRing>
                )}

                <Group title="Details">
                  <ListRow title="Holder" value={d.extractedName ?? '—'} chevron={false} />
                  <ListRow title="Number" value={d.number} chevron={false} />
                  <ListRow title="Status" chevron={false} trailing={<Badge label={badge.label} tone={badge.tone} icon={badge.icon} dot={badge.dot} />} />
                  <ListRow title="Added" value={prettyDate(d.addedAt)} chevron={false} />
                  <ListRow title="Expires" value={prettyDate(expires)} chevron={false} />
                  <ListRow title="Match" value={pct != null ? `${pct}%` : '—'} chevron={false} />
                  <ListRow
                    title="Source"
                    value={d.source ? d.source.replace(/^\w/, (c) => c.toUpperCase()) : '—'}
                    chevron={false}
                  />
                </Group>

                {/* Selective disclosure — extracted fields behind a tap */}
                <View style={{ gap: 10 }}>
                  <Group title="Extracted fields">
                    <ListRow
                      icon={ShieldCheck}
                      tone="sky"
                      title={showExtracted ? 'Hide extracted fields' : 'View extracted fields'}
                      sub="Date of birth, nationality, issuing state"
                      onPress={() => setShowExtracted((e) => !e)}
                      trailing={showExtracted ? <ChevronDown size={18} color={C.ink4} /> : <ChevronRight size={18} color={C.ink4} />}
                    />
                    {showExtracted ? <ListRow title="Date of birth" value={prettyDate(d.extractedDob)} chevron={false} /> : null}
                    {showExtracted ? <ListRow title="Nationality" value={d.nationality ?? '—'} chevron={false} /> : null}
                    {showExtracted ? <ListRow title="Issuing state" value={d.issuingState ?? '—'} chevron={false} /> : null}
                  </Group>
                  <Txt v="small" color={C.ink4} style={{ marginLeft: 4 }}>
                    Sensitive fields stay hidden until needed.
                  </Txt>
                </View>

                {/* Usage history per document has no backend yet. */}
                <SoonOverlay>
                  <Group title="Recently used at">
                    <ListRow icon={History} tone="sky" title="Check-ins with this document" sub="See where this document was used" chevron={false} />
                  </Group>
                </SoonOverlay>

                <Card pad={0} style={{ paddingHorizontal: 16 }}>
                  <ListRow
                    icon={Trash2}
                    danger
                    title="Remove from wallet"
                    chevron={false}
                    onPress={removing ? undefined : () => setConfirmRemove(true)}
                    trailing={removing ? <ActivityIndicator size="small" color={C.red} accessibilityLabel="Removing" /> : undefined}
                  />
                </Card>
              </>
            );
          }}
        </Async>
      </Screen>

      <ConfirmSheet
        visible={confirmRemove}
        icon={Trash2}
        danger
        title="Remove this document?"
        body="It will be deleted from your account. You can add it again later."
        confirmLabel="Remove document"
        loading={removing}
        onConfirm={doRemove}
        onCancel={() => {
          if (!removing) setConfirmRemove(false);
        }}
      />
    </>
  );
}
