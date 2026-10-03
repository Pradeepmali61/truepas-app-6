/** @jsxImportSource react */
/**
 * Your identity — GET /cb/identity/summary. Status is computed server-side:
 * face + document verified → "verified", anything missing/pending/failed →
 * "incomplete". Shows the verified / almost-there card with the next-step
 * hint, the Face / Document / Selfie checks, linked documents, recent
 * activity and the next-step CTA. The scannable venue pass in the approved
 * design has no backend yet ("Coming soon").
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { BadgeCheck, FileText, ScanFace, ShieldCheck, UserRoundCheck } from 'lucide-react-native';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDocuments } from '@/features/documents/hooks';
import { useIdentitySummary } from '@/features/identity/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { Glow, IdentityCard, PassCode } from '@/premium/blocks';
import { fmtMonthYear, StatusBadge, statusLabel, statusTileTone } from '@/premium/flows/home';
import { EmptyView, ErrorView, LoadingView, SoonOverlay } from '@/premium/kit';
import { C, G, R, SH } from '@/premium/theme';
import { Button, Card, Divider, Footer, Group, ListRow, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';
import type { ActivityItem } from '@/types/domain';

export default function IdentityScreen() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { url: avatarUri } = useProfilePicture();
  const { data: summary, isPending, isError, refetch, isRefetching } = useIdentitySummary();
  const documents = useDocuments();

  if (isPending) {
    return (
      <Screen header={<TopBar title="Your identity" />} scroll={false}>
        <LoadingView label="Loading identity…" full />
      </Screen>
    );
  }

  if (isError || !summary) {
    return (
      <Screen header={<TopBar title="Your identity" />}>
        <ErrorView
          title="Couldn't load identity status"
          body="Please check your connection and try again."
          onRetry={() => void refetch()}
        />
      </Screen>
    );
  }

  const verified = summary.status === 'verified';

  const incompleteHint =
    summary.face !== 'verified' ? 'Complete face verification to finish.'
    : summary.document === 'missing' ? 'Add a document to finish verification.'
    : summary.document === 'pending' ? 'Your document is being reviewed.'
    : summary.document === 'failed' ? 'Document verification failed — try again.'
    : summary.selfieMatch !== 'verified' ? 'Selfie match is still pending.'
    : 'Finish verification to unlock check-ins.';

  const cta = summary.document === 'pending'
    ? { label: 'View document status', route: '/(tabs)/documents' }
    : summary.document !== 'verified'
      ? { label: 'Add a document', route: '/document/select-type' }
      : summary.face !== 'verified'
        ? { label: 'Verify your face', route: '/face-update/pin' }
        : null;

  const docs = documents.data ?? [];
  const verifiedDocs = docs.filter((d) => d.status === 'verified').length;

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: cta ? 16 : 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching || documents.isRefetching}
            onRefresh={() => {
              void refetch();
              void documents.refetch();
            }}
            tintColor={C.white}
          />
        }
      >
        {/* ---------- venue pass (no backend yet) ---------- */}
        <View style={{ paddingBottom: 30 }}>
          <LinearGradient colors={G.night} style={StyleSheet.absoluteFill} />
          <Glow size={420} opacity={0.35} style={{ top: -120, left: -40 }} />
          <SafeAreaView edges={['top']}>
            <TopBar tone="glass" title="Your identity" />
          </SafeAreaView>
          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <SoonOverlay>
              <View style={[{ backgroundColor: C.white, borderRadius: R.xxl, padding: 22, alignItems: 'center', gap: 14 }, SH.lg]}>
                <Row gap={8}>
                  <BadgeCheck size={18} color={C.sky} />
                  <Txt v="smallStrong">Show this at any Truepas venue</Txt>
                </Row>
                <PassCode size={176} />
                <Txt v="small">Your personal venue pass</Txt>
              </View>
            </SoonOverlay>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 26, marginTop: 4 }}>
          <IdentityCard
            name={user?.fullName ?? ''}
            idLine={user?.email ?? ''}
            photoUri={avatarUri ?? null}
            verified={verified}
            statusLabel={verified ? 'Verified' : 'Incomplete'}
            meta={[
              { k: 'Face', v: statusLabel(summary.face) },
              { k: 'Documents', v: documents.data ? `${verifiedDocs} verified` : '—' },
              { k: 'Selfie', v: statusLabel(summary.selfieMatch) },
            ]}
          />

          {/* ---------- status ---------- */}
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Tile icon={ShieldCheck} tone={verified ? 'green' : 'amber'} size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="h3">{verified ? "You're verified" : 'Almost there'}</Txt>
              <Txt v="small">{verified ? 'Your face and document are verified.' : incompleteHint}</Txt>
            </View>
            <StatusBadge status={summary.status} />
          </Card>

          {/* ---------- checks ---------- */}
          <Group title="Verification checks">
            <ListRow
              icon={ScanFace}
              tone={statusTileTone(summary.face)}
              title="Face enrollment"
              trailing={<StatusBadge status={summary.face} />}
              chevron={false}
            />
            <ListRow
              icon={FileText}
              tone={statusTileTone(summary.document)}
              title="Identity document"
              trailing={<StatusBadge status={summary.document} />}
              chevron={false}
            />
            <ListRow
              icon={UserRoundCheck}
              tone={statusTileTone(summary.selfieMatch)}
              title="Selfie match"
              trailing={<StatusBadge status={summary.selfieMatch} />}
              chevron={false}
            />
          </Group>

          {/* ---------- linked documents ---------- */}
          {docs.length > 0 && (
            <Group title="Linked documents">
              {docs.map((d) => (
                <ListRow
                  key={d.id}
                  icon={FileText}
                  tone="sky"
                  title={d.label}
                  sub={`${statusLabel(d.status)} · ${d.expiresAt ? `Exp. ${fmtMonthYear(d.expiresAt)}` : d.number}`}
                  onPress={() => router.push(`/document/${d.id}` as never)}
                />
              ))}
            </Group>
          )}

          {/* ---------- recent activity ---------- */}
          <View style={{ gap: 10 }}>
            <Txt v="micro" style={{ marginLeft: 4 }}>
              Recent activity
            </Txt>
            <Card pad={0} style={{ paddingHorizontal: 16 }}>
              {summary.activity.length > 0 ? (
                summary.activity.map((item, i) => (
                  <View key={item.id}>
                    {i > 0 && <Divider inset={22} />}
                    <ActivityRow item={item} />
                  </View>
                ))
              ) : (
                <EmptyView compact title="No activity yet" body="Verification events will appear here." />
              )}
            </Card>
          </View>
        </View>
      </ScrollView>

      {cta && (
        <Footer>
          <Button label={cta.label} onPress={() => router.push(cta.route as never)} />
        </Footer>
      )}
    </View>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const dot = item.tone === 'success' ? C.green : item.tone === 'error' ? C.red : C.amber;
  return (
    <Row gap={12} style={{ paddingVertical: 14 }}>
      <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: dot }} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="bodyStrong" lines={1}>
          {item.title}
        </Txt>
        <Txt v="small">{item.timestamp}</Txt>
      </View>
    </Row>
  );
}
