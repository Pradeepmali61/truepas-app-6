/** @jsxImportSource react */
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    Camera,
    ChevronDown,
    ChevronRight,
    FileText,
    ScanLine,
    ShieldCheck,
    Trash2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useDocument, useDocumentImages, useRemoveDocument } from '@/features/documents/hooks';
import { displayDocNumber } from '@/features/documents/format';
import { useToast } from '@/hooks/useToast';
import {
    DocumentCard,
    FlipCard,
    MatchRing,
    docMeta,
    localDay,
    matchPct,
    prettyDate,
    statusBadge,
} from '@/premium/flows/documents';
import { Async, Bone, ConfirmSheet, EmptyView, SkeletonList } from '@/premium/kit';
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
 *  (flips to the scan), verify card when a match score exists, the stored
 *  images (GET /documents/{id}/images), detail rows with selective
 *  disclosure, Verify now / Remove actions. */
export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const toast = useToast();

  const docQuery = useDocument(id);
  // Signed, expiring URLs — refetched with the screen, never cached to disk.
  const imagesQuery = useDocumentImages(id);
  const removeDocument = useRemoveDocument();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [scanImageUri, setScanImageUri] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  // Sensitive extracted fields stay hidden until asked for.
  const [showExtracted, setShowExtracted] = useState(false);

  // Local copy of the capture (keyed by docId, saved at scan time) — the
  // fallback for "View scan" when the server has no front image.
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
  const serverFront = imagesQuery.data?.front?.url ?? null;

  // Re-verify re-captures via the scan flow (design pushes `docVerify`).
  const reverify = (d: IdentityDocument) =>
    router.push({
      pathname: '/document/scan',
      params: {
        type: d.type,
        label: d.label,
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
        onRefresh={
          id
            ? () => {
                void docQuery.refetch();
                void imagesQuery.refetch();
              }
            : undefined
        }
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
                    scanUri={serverFront ?? scanImageUri}
                    front={(h) => (
                      <DocumentCard
                        type={d.type}
                        label={d.label}
                        number={displayDocNumber(d.number)}
                        status={d.status}
                        holder={d.extractedName}
                        expiresAt={expires}
                        issuer={(isLicense ? d.issuingState : d.nationality) || null}
                        height={h}
                      />
                    )}
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
                    {/* Sharing is deferred by the backend (§13 #15) — the second
                        action rescans the document instead (renewed card, a
                        better photo, or a failed check). */}
                    <View style={{ flex: 1 }}>
                      <Button label="Rescan" icon={ScanLine} size="md" onPress={() => reverify(d)} />
                    </View>
                  </Row>
                </View>

                {/* Verify card — match score + re-verify (only when a score exists) */}
                {pct != null && (
                  <MatchRing
                    value={pct}
                    label="Document match"
                    sub={d.verifiedAt ? `${meta.label} · verified ${localDay(d.verifiedAt)}` : `${meta.label} · added ${prettyDate(d.addedAt)}`}
                    right={<Badge label={badge.label} tone={badge.tone} icon={badge.icon} dot={badge.dot} />}
                  />
                )}

                <Group title="Details">
                  <ListRow title="Holder" value={d.extractedName ?? '—'} chevron={false} />
                  <ListRow title="Number" value={displayDocNumber(d.number) || '—'} chevron={false} />
                  <ListRow title="Status" chevron={false} trailing={<Badge label={badge.label} tone={badge.tone} icon={badge.icon} dot={badge.dot} />} />
                  <ListRow title="Added" value={prettyDate(d.addedAt)} chevron={false} />
                  {d.verifiedAt ? <ListRow title="Verified on" value={localDay(d.verifiedAt)} chevron={false} /> : null}
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
