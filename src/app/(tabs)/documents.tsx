/** @jsxImportSource react */
/**
 * Wallet (Documents tab) — identity-status summary, the user's documents as a
 * fanned wallet stack, and venue-issued credentials.
 *
 * Data: useIdentitySummary + useDocuments. There is no issued-credentials
 * endpoint in our API yet, so that section renders its empty state.
 */
import { useRouter } from 'expo-router';
import { FileText, Plus, ScanFace, ShieldCheck, Ticket, UserRoundCheck } from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDocuments } from '@/features/documents/hooks';
import { useIdentitySummary } from '@/features/identity/hooks';
import { TAB_BAR_SPACE } from '@/premium/blocks';
import {
  DOC_STYLE,
  StatusBadge,
  statusTileTone,
  TabTitle,
  WALLET_CARD_H,
  WALLET_PEEK,
  WalletCard,
} from '@/premium/flows/home';
import { Async, Bone, EmptyView } from '@/premium/kit';
import { C, R } from '@/premium/theme';
import { Button, Card, Chip, Divider, IconCircle, Row, SectionHead, Tile, Txt } from '@/premium/ui';
import type { DocumentType, IdentityDocument, IdentitySummary } from '@/types/domain';

type Cat = 'all' | 'identity' | 'travel' | 'driving';

const CATS: { key: Exclude<Cat, 'all'>; label: string; types: DocumentType[] }[] = [
  { key: 'identity', label: 'Identity', types: ['passport', 'idCard', 'greenCard', 'birthCertificate'] },
  { key: 'travel', label: 'Travel', types: ['passport', 'usVisa'] },
  { key: 'driving', label: 'Driving', types: ['drivingLicense'] },
];

const ALL_TYPES: DocumentType[] = ['passport', 'drivingLicense', 'idCard', 'greenCard', 'birthCertificate', 'usVisa'];

export default function DocumentsScreen() {
  const router = useRouter();
  const summary = useIdentitySummary();
  const documents = useDocuments();
  const [cat, setCat] = useState<Cat>('all');

  const refreshing = summary.isRefetching || documents.isRefetching;
  const onRefresh = () => {
    void summary.refetch();
    void documents.refetch();
  };

  const addDocument = () => router.push('/document/select-type' as never);
  const missingTypes = documents.data
    ? ALL_TYPES.filter((t) => !documents.data.some((d) => d.type === t)).slice(0, 2)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.sky} />}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: TAB_BAR_SPACE + 20, gap: 26 }}
        >
          <TabTitle right={<IconCircle icon={Plus} tone="sky" label="Add document" onPress={addDocument} />}>Wallet</TabTitle>

          {/* ---------- identity status ---------- */}
          <Async q={summary} compact skeleton={<Bone h={236} r={R.xl} />}>
            {(s) => <IdentityStatusCard s={s} docs={documents.data} />}
          </Async>

          {/* ---------- your documents ---------- */}
          <View style={{ gap: 16 }}>
            <SectionHead title="Your documents" />
            <Async
              q={documents}
              compact
              empty={(docs) => docs.length === 0}
              emptyView={
                <Card>
                  <EmptyView
                    compact
                    icon={FileText}
                    title="No documents yet"
                    body="Add a passport, ID card, or license to verify your identity."
                    action={<Button label="Add a document" icon={Plus} size="sm" full={false} onPress={addDocument} />}
                  />
                </Card>
              }
              skeleton={<Bone h={WALLET_CARD_H} r={R.xl} />}
            >
              {(docs) => <DocumentStack docs={docs} cat={cat} setCat={setCat} onOpen={(d) => router.push(`/document/${d.id}` as never)} />}
            </Async>
          </View>

          {/* ---------- add more ---------- */}
          {missingTypes.length > 0 && (
            <View style={{ gap: 16 }}>
              <SectionHead title="Add more to your wallet" />
              <Row gap={12} align="stretch">
                {missingTypes.map((t) => (
                  <Card
                    key={t}
                    flat
                    onPress={addDocument}
                    style={{ flex: 1, gap: 12, borderStyle: 'dashed', borderColor: C.line, borderWidth: 1.5 }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: R.sm,
                        backgroundColor: C.skyWash,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Plus size={18} color={C.skyPressed} />
                    </View>
                    <View>
                      <Txt v="bodyStrong" lines={1}>
                        {DOC_STYLE[t].title}
                      </Txt>
                      <Txt v="small">Scan to add</Txt>
                    </View>
                  </Card>
                ))}
              </Row>
            </View>
          )}

          {/* ---------- issued to you ---------- */}
          <View style={{ gap: 16 }}>
            <SectionHead title="Issued to you" />
            <Card>
              <EmptyView
                compact
                icon={Ticket}
                title="No issued credentials"
                body="Credentials issued at venue check-ins appear here."
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function IdentityStatusCard({ s, docs }: { s: IdentitySummary; docs?: IdentityDocument[] }) {
  const verified = s.status === 'verified';
  const verifiedDocs = docs?.filter((d) => d.status === 'verified').length ?? 0;
  const checks = [
    { label: 'Face enrollment', value: s.face, icon: ScanFace },
    { label: 'Identity document', value: s.document, icon: FileText },
    { label: 'Selfie match', value: s.selfieMatch, icon: UserRoundCheck },
  ];
  return (
    <Card pad={0} style={{ paddingHorizontal: 16 }}>
      <Row gap={14} style={{ paddingVertical: 16 }}>
        <Tile icon={ShieldCheck} tone={verified ? 'green' : 'amber'} size={46} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="bodyStrong">Identity status</Txt>
          <Txt v="small">
            {docs && docs.length > 0
              ? `${verifiedDocs} of ${docs.length} document${docs.length === 1 ? '' : 's'} verified`
              : verified
                ? 'Your face and document are verified.'
                : 'Finish verification to unlock check-ins.'}
          </Txt>
        </View>
        <StatusBadge status={s.status} />
      </Row>
      {checks.map((c) => (
        <View key={c.label}>
          <Divider inset={0} />
          <Row gap={14} style={{ paddingVertical: 12 }}>
            <Tile icon={c.icon} tone={statusTileTone(c.value)} size={36} />
            <Txt v="body" color={C.ink} style={{ flex: 1 }}>
              {c.label}
            </Txt>
            <StatusBadge status={c.value} />
          </Row>
        </View>
      ))}
    </Card>
  );
}

function DocumentStack({
  docs,
  cat,
  setCat,
  onOpen,
}: {
  docs: IdentityDocument[];
  cat: Cat;
  setCat: (c: Cat) => void;
  onOpen: (d: IdentityDocument) => void;
}) {
  /* Category chips filter locally — only categories the user actually has. */
  const cats = CATS.filter((c) => docs.some((d) => c.types.includes(d.type)));
  const showChips = docs.length > 1 && cats.length > 1;
  const active = showChips && cat !== 'all' && cats.some((c) => c.key === cat) ? cat : 'all';
  const types = CATS.find((c) => c.key === active)?.types;
  const shown = types ? docs.filter((d) => types.includes(d.type)) : docs;

  return (
    <View style={{ gap: 18 }}>
      {showChips && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Chip label="All" active={active === 'all'} onPress={() => setCat('all')} />
          {cats.map((c) => (
            <Chip key={c.key} label={c.label} active={active === c.key} onPress={() => setCat(c.key)} />
          ))}
        </ScrollView>
      )}
      {/* fanned stack — each card keeps its top WALLET_PEEK px visible */}
      <View style={{ height: WALLET_CARD_H + (shown.length - 1) * WALLET_PEEK }}>
        {shown.map((d, i) => (
          <View key={d.id} style={{ position: 'absolute', left: 0, right: 0, top: i * WALLET_PEEK }}>
            <WalletCard d={d} onPress={() => onOpen(d)} />
          </View>
        ))}
      </View>
    </View>
  );
}
