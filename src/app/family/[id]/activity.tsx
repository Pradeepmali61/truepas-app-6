/** @jsxImportSource react */
/**
 * Member activity — GET /cb/family/{personId}/activity. The projection isn't
 * connected yet so this usually returns []. The timeline is never empty
 * though: a "first check-in" placeholder and the member's next milestone
 * (turning 18) lead, then the server events, or — while there are none —
 * events derived from real member data (face, documents, joined the family).
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Cake, FileCheck, History, type LucideIcon, MapPin, ScanFace, UserPlus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useDocuments } from '@/features/documents/hooks';
import { useFamilyActivity, useFamilyMember, useMemberPhoto } from '@/features/family/hooks';
import { docStyle, fmtDate } from '@/premium/flows/home';
import { Bone, ErrorView } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Avatar, Badge, type BadgeTone, Card, Heading, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';
import type { ActivityLogItem, FamilyMember, IdentityDocument } from '@/types/domain';

function when(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleString();
}

type TileTone = 'sky' | 'navy' | 'green' | 'amber' | 'neutral';

type Entry = {
  id: string;
  icon: LucideIcon;
  tone: TileTone;
  title: string;
  sub: string;
  badge?: { label: string; tone: BadgeTone };
  onPress?: () => void;
};

/** 18th birthday as ISO when it is still ahead, else null. */
function eighteenth(m: FamilyMember): string | null {
  if (!m.dateOfBirth || m.age >= 18) return null;
  const d = new Date(m.dateOfBirth);
  if (Number.isNaN(d.getTime())) return null;
  d.setFullYear(d.getFullYear() + 18);
  return d.getTime() > Date.now() ? d.toISOString() : null;
}

const DOC_VERB: Partial<Record<IdentityDocument['status'], { verb: string; tone: TileTone }>> = {
  verified: { verb: 'verified', tone: 'green' },
  pending: { verb: 'added', tone: 'sky' },
  failed: { verb: 'check failed', tone: 'amber' },
};

function buildTimeline(
  m: FamilyMember | undefined,
  first: string,
  events: ActivityLogItem[],
  docs: IdentityDocument[],
  openMember: () => void,
): Entry[] {
  const out: Entry[] = [
    {
      id: 'first-checkin',
      icon: MapPin,
      tone: 'neutral',
      title: `${first}'s first check-in`,
      sub: 'Shows up here after their first visit',
      badge: { label: 'Waiting', tone: 'neutral' },
    },
  ];
  const adult = m ? eighteenth(m) : null;
  if (adult) {
    out.push({ id: 'turns-18', icon: Cake, tone: 'sky', title: `Turns 18 on ${fmtDate(adult)}`, sub: 'Upcoming milestone' });
  }
  if (events.length > 0) {
    events.forEach((e, i) =>
      out.push({ id: e.id, icon: History, tone: i === 0 ? 'navy' : 'sky', title: e.title, sub: when(e.date) }),
    );
    return out;
  }
  if (!m) return out;
  const faceDone = m.faceEnrolled || m.verification === 'verified';
  out.push(
    faceDone
      ? { id: 'face', icon: ScanFace, tone: 'green', title: 'Face enrolled', sub: 'Checks in with their own face' }
      : {
          id: 'face',
          icon: ScanFace,
          tone: 'amber',
          title: 'Face scan pending',
          sub: 'Needed to check in at venues',
          badge: { label: 'Scan now', tone: 'amber' },
          onPress: openMember,
        },
  );
  [...docs]
    .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
    .forEach((d) => {
      const v = DOC_VERB[d.status];
      if (!v) return;
      out.push({
        id: `doc-${d.id}`,
        icon: FileCheck,
        tone: v.tone,
        title: `${docStyle(d.type).title} ${v.verb}`,
        sub: d.addedAt ? fmtDate(d.addedAt) : d.label,
      });
    });
  out.push({ id: 'joined', icon: UserPlus, tone: 'sky', title: 'Added to your family', sub: `${m.relationship} · ${m.age} yrs` });
  return out;
}

function TimelineSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      {[0, 1, 2].map((i) => (
        <Row key={i} gap={14} align="flex-start">
          <Bone w={44} h={44} r={22} />
          <Card style={{ flex: 1, gap: 8 }} pad={16}>
            <Bone w="70%" />
            <Bone w="40%" h={11} />
          </Card>
        </Row>
      ))}
    </View>
  );
}

export default function FamilyMemberActivityScreen() {
  const router = useRouter();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { data: member } = useFamilyMember(id);
  const photoUri = useMemberPhoto(id);
  const memberDocs = useDocuments(id);
  const activity = useFamilyActivity(id);
  const { data: events, isPending, isError, refetch } = activity;

  const fullName = name ?? member?.name;
  const first = (fullName ?? 'Member').split(' ')[0];
  const timeline = buildTimeline(member ?? undefined, first, events ?? [], memberDocs.data ?? [], () => router.back());

  return (
    <Screen
      header={<TopBar title="Activity" right={fullName ? <Avatar uri={photoUri} name={fullName} size={36} /> : undefined} />}
      contentStyle={{ paddingTop: 4, flexGrow: 1 }}
      refreshing={activity.isRefetching || memberDocs.isRefetching}
      onRefresh={() => {
        void refetch();
        void memberDocs.refetch();
      }}>
      <Heading title={`${first}'s`} accent="activity." sub="Check-ins, verification and milestones." />
      {isError ? (
        <ErrorView
          title="Couldn't load activity"
          body="Please check your connection and try again."
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <TimelineSkeleton />
      ) : (
        <View>
          {timeline.map((e, i) => (
            <Row key={e.id} gap={14} align="flex-start">
              <View style={{ alignItems: 'center', width: 44, alignSelf: 'stretch' }}>
                {e.id === 'first-checkin' ? (
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      borderWidth: 1.5,
                      borderStyle: 'dashed',
                      borderColor: C.ink4,
                      backgroundColor: C.canvas,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <MapPin size={18} color={C.ink3} />
                  </View>
                ) : (
                  <Tile icon={e.icon} tone={e.tone} size={44} radius={22} />
                )}
                {i < timeline.length - 1 && (
                  <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: C.line, marginVertical: 6 }} />
                )}
              </View>
              <TimelineCard e={e} />
            </Row>
          ))}
        </View>
      )}
    </Screen>
  );
}

function TimelineCard({ e }: { e: Entry }) {
  const body = (
    <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} pad={16}>
      <View style={{ flex: 1, gap: 4 }}>
        <Txt v="bodyStrong">{e.title}</Txt>
        <Txt v="small" color={C.ink4}>
          {e.sub}
        </Txt>
      </View>
      {e.badge && <Badge label={e.badge.label} tone={e.badge.tone} />}
    </Card>
  );
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      {e.onPress ? (
        <Pressable onPress={e.onPress} accessibilityRole="button" accessibilityLabel={`${e.title}. ${e.sub}`}>
          {body}
        </Pressable>
      ) : (
        body
      )}
    </View>
  );
}
