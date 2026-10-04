/** @jsxImportSource react */
/**
 * Home — "my identity + my journey". Premium layout over the real data the
 * original HomeScreen used: useFamily / useBookings / useNotifications(unread)
 * plus the identity summary for the identity-card badge.
 *
 * Header avatar opens the profile drawer (account card + settings menu +
 * sign out / delete account); bell shows the unread dot; next upcoming
 * booking is the hero; stacked family card (you + members, face status);
 * the two most recent past check-ins; pull-to-refresh refetches everything.
 *
 * No upcoming bookings (every new user): the hero and carousel keep their
 * photo cards but show the user's real setup progress (face / ID / family),
 * where Truepas works and how it works, instead of disappearing.
 */
import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarDays,
  FileScan,
  KeyRound,
  type LucideIcon,
  MapPin,
  QrCode,
  ScanFace,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useFamily } from '@/features/family/hooks';
import { useBookings } from '@/features/history/hooks';
import { useIdentitySummary } from '@/features/identity/hooks';
import { useNotifications } from '@/features/notifications/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { IdentityCard, TAB_BAR_SPACE } from '@/premium/blocks';
import {
  BookingCarouselCard,
  BookingHero,
  BookingRow,
  greeting,
  isTodayIso,
  ProfileDrawer,
  ReadyHero,
  SoonAction,
  TogetherCard,
  VENUES,
  VenueCard,
} from '@/premium/flows/home';
import { Async, Bone, ComingSoon, EmptyView, SkeletonList } from '@/premium/kit';
import { C, F, R } from '@/premium/theme';
import { Avatar, Button, Card, Divider, IconCircle, Press, Row, SectionHead, Serif, Tile, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';
import type { VerificationStatus } from '@/types/domain';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { url: avatarUri } = useProfilePicture();
  const [drawer, setDrawer] = useState(false);

  const family = useFamily();
  const bookings = useBookings();
  const unread = useNotifications(true);
  const summary = useIdentitySummary();

  const hasUnread = (unread.data?.pages.flat() ?? []).length > 0;
  const past = bookings.data?.filter((b) => b.status !== 'upcoming') ?? [];
  const upcoming = (bookings.data?.filter((b) => b.status === 'upcoming') ?? []).sort((a, b) =>
    a.checkIn.localeCompare(b.checkIn),
  );
  const [nextUpcoming, ...laterUpcoming] = upcoming;

  /* No trips yet: the hero shows real setup progress instead of a booking. */
  const noTrips = bookings.data != null && upcoming.length === 0;
  const showCarousel = laterUpcoming.length > 0 || noTrips;

  const refreshing = family.isRefetching || bookings.isRefetching || unread.isRefetching || summary.isRefetching;
  const onRefresh = () => {
    void family.refetch();
    void bookings.refetch();
    void unread.refetch();
    void summary.refetch();
  };

  const open = (href: string) => () => router.push(href as never);
  const firstName = user?.fullName?.trim().split(/\s+/)[0] ?? '';

  /* Identity-card badge: the server-computed summary when we have it,
     otherwise the session's face-enrolment flag. */
  const idVerified = summary.data ? summary.data.status === 'verified' : !!user?.faceEnrolled;
  const idLabel = summary.data
    ? summary.data.status === 'verified'
      ? 'Verified'
      : 'Incomplete'
    : user?.faceEnrolled
      ? 'Face linked'
      : 'Setup pending';

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + 20, gap: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.sky} />}
        >
          {/* ---------- greeting + identity ---------- */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 22 }}>
            <Row between>
              <Press onPress={() => setDrawer(true)} label="Profile" role="button">
                <Row gap={12}>
                  <Avatar uri={avatarUri} name={user?.fullName} size={46} ring />
                  <View>
                    <Txt v="small">{greeting()}</Txt>
                    <Txt v="h3" style={{ fontSize: 19 }} lines={1}>
                      {firstName}
                    </Txt>
                  </View>
                </Row>
              </Press>
              <IconCircle icon={Bell} label="Notifications" dot={hasUnread} onPress={open('/notification')} />
            </Row>

            <Text style={{ fontFamily: F.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1, color: C.ink }}>
              Where are you{'\n'}going <Serif size={40} color={C.sky}>today?</Serif>
            </Text>

            <IdentityCard
              compact
              name={user?.fullName ?? ''}
              idLine={user?.email ?? ''}
              photoUri={avatarUri ?? null}
              verified={idVerified}
              statusLabel={idLabel}
              onPress={open('/identity')}
            />
          </View>

          {/* ---------- next check-in — the primary moment ---------- */}
          {bookings.isPending && bookings.data == null ? (
            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              <Bone w="38%" h={20} />
              <Bone h={320} r={R.xxl} />
            </View>
          ) : nextUpcoming != null ? (
            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              <SectionHead
                title={isTodayIso(nextUpcoming.checkIn) ? 'Today' : 'Next check-in'}
                action="Details"
                onAction={open(`/booking/${nextUpcoming.id}`)}
              />
              <BookingHero
                b={nextUpcoming}
                onPress={open(`/booking/${nextUpcoming.id}`)}
                cta={
                  <SoonAction light>
                    <Button label="Check in with your face" icon={ScanFace} />
                  </SoonAction>
                }
              />
            </View>
          ) : noTrips ? (
            <View style={{ paddingHorizontal: 20, gap: 16 }}>
              {summary.isPending && summary.data == null ? (
                <>
                  <Bone w="38%" h={20} />
                  <Bone h={320} r={R.xxl} />
                </>
              ) : (
                <GetReady
                  faceDone={summary.data ? summary.data.face === 'verified' : !!user?.faceEnrolled}
                  doc={summary.data?.document}
                  familyCount={family.data?.length ?? 0}
                  open={open}
                />
              )}
            </View>
          ) : null}

          {/* ---------- no trips: where Truepas works ---------- */}
          {noTrips && (
            <View style={{ gap: 16 }}>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionHead title="Use Truepas at" />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 16 }}
              >
                {VENUES.map((v) => (
                  <VenueCard key={v.kind} v={v} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ---------- no trips: how it works ---------- */}
          {noTrips && (
            <View style={{ paddingHorizontal: 20, gap: 16, marginTop: -14 }}>
              <SectionHead title="How it works" />
              <Card pad={18}>
                <Row gap={10} align="flex-start">
                  <HowStep n={1} icon={CalendarDays} title="Book" sub="Stay, ride or show at a partner venue" />
                  <HowStep n={2} icon={MapPin} title="Arrive" sub="No queue, no forms to fill" />
                  <HowStep n={3} icon={ScanFace} title="Look & walk in" sub="Your face is your key" />
                </Row>
              </Card>
            </View>
          )}

          {/* ---------- coming up ---------- */}
          {laterUpcoming.length > 0 && (
            <View style={{ gap: 16 }}>
              <View style={{ paddingHorizontal: 20 }}>
                <SectionHead title="Coming up" action="See all" onAction={open('/(tabs)/history')} />
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 16 }}
              >
                {laterUpcoming.map((b) => (
                  <BookingCarouselCard key={b.id} b={b} onPress={open(`/booking/${b.id}`)} />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ---------- quick actions ---------- */}
          <View style={{ paddingHorizontal: 20, gap: 16, marginTop: showCarousel && !noTrips ? -14 : 0 }}>
            <SectionHead title="Quick actions" />
            <Row gap={10} align="stretch">
              <QuickAction icon={FileScan} label={'Add\ndocument'} onPress={open('/document/select-type')} />
              <QuickAction icon={UserPlus} label={'Add\nfamily'} onPress={open('/family/add')} />
              <QuickAction icon={QrCode} label={'Share\nidentity'} soon />
              <QuickAction icon={KeyRound} label={'Digital\nkeys'} soon />
            </Row>
          </View>

          {/* ---------- family ---------- */}
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <SectionHead title="Travelling together" action="Manage" onAction={open('/family')} />
            <Async
                q={family}
                compact
                skeleton={
                  <Card pad={18} style={{ gap: 16 }}>
                    <Row gap={6}>
                      {[0, 1, 2, 3].map((i) => (
                        <Bone key={i} w={50} h={50} r={25} />
                      ))}
                    </Row>
                    <Bone w="60%" h={14} />
                  </Card>
                }
              >
                {(members) => (
                  <TogetherCard
                    members={members}
                    you={{ name: user?.fullName, uri: avatarUri, faceEnrolled: !!user?.faceEnrolled }}
                    onOpen={open('/family')}
                    onAdd={open('/family/add')}
                    onMember={(id) => router.push(`/family/${id}` as never)}
                  />
                )}
              </Async>
          </View>

          {/* ---------- previous check-ins ---------- */}
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            <SectionHead title="Recent check-ins" action="See all" onAction={open('/(tabs)/history')} />
            <Async q={bookings} compact skeleton={<SkeletonList rows={2} thumb={62} />}>
              {() =>
                past.length === 0 ? (
                  <Card>
                    <EmptyView
                      compact
                      icon={CalendarDays}
                      title="No check-ins yet"
                      body="When you check in at a venue with Truepas, it shows up here."
                    />
                  </Card>
                ) : (
                  <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
                    {past.slice(0, 2).map((b, i) => (
                      <View key={b.id}>
                        {i > 0 && <Divider inset={76} />}
                        <BookingRow b={b} onPress={open(`/booking/${b.id}`)} />
                      </View>
                    ))}
                  </Card>
                )
              }
            </Async>
          </View>
        </ScrollView>
      </SafeAreaView>

      <ProfileDrawer visible={drawer} onClose={() => setDrawer(false)} />
    </View>
  );
}

/**
 * No-trips hero: the next setup step, from the same checks the Identity
 * screen uses (face → document → family). Nothing here is a made-up booking.
 */
function GetReady({
  faceDone,
  doc,
  familyCount,
  open,
}: {
  faceDone: boolean;
  doc?: VerificationStatus;
  familyCount: number;
  open: (href: string) => () => void;
}) {
  const docDone = doc === 'verified';
  const steps = [
    { label: 'Face', done: faceDone },
    { label: 'ID', done: docDone },
    { label: 'Family', done: familyCount > 0 },
  ];
  const allDone = steps.every((x) => x.done);

  const hero = !faceDone
    ? {
        photo: 'stadium' as const,
        chip: { icon: ScanFace, label: 'Face ID' },
        eyebrow: 'Next step',
        title: 'Your face is your key',
        body: 'Enrol your face once, then check in at partner venues with just a look.',
        cta: <Button label="Set up face ID" icon={ScanFace} onPress={open('/face-update/pin')} />,
      }
    : doc === 'pending'
      ? {
          photo: 'room' as const,
          chip: { icon: FileScan, label: 'Document' },
          eyebrow: 'In review',
          title: 'Your ID is being checked',
          body: "We'll let you know as soon as it's verified. Nothing else to do for now.",
          cta: <Button label="View document status" tone="glass" onPress={open('/(tabs)/documents')} />,
        }
      : !docDone
        ? {
            photo: 'hotelNight' as const,
            chip: { icon: FileScan, label: 'Document' },
            eyebrow: 'Next step',
            title: 'Add your ID once',
            body: 'Scan your passport or ID card and travel everywhere with one verified identity.',
            cta: <Button label="Add a document" icon={FileScan} onPress={open('/document/select-type')} />,
          }
        : familyCount === 0
          ? {
              photo: 'hotelDusk' as const,
              chip: { icon: Users, label: 'Family' },
              eyebrow: 'Almost there',
              title: 'Travelling with family?',
              body: 'Add them now and check in together, kids included.',
              cta: <Button label="Add family member" icon={UserPlus} onPress={open('/family/add')} />,
            }
          : {
              photo: 'hotelPool' as const,
              chip: { icon: ShieldCheck, label: 'Verified' },
              eyebrow: "You're all set",
              title: 'Ready for your first check-in',
              body: 'Book with a Truepas partner venue and your trip will show up right here.',
              cta: undefined,
            };

  return (
    <>
      <SectionHead
        title={allDone ? 'Next check-in' : 'Get ready to travel'}
        action="Identity"
        onAction={open('/identity')}
      />
      <ReadyHero {...hero} steps={steps} />
    </>
  );
}

function HowStep({ n, icon, title, sub }: { n: number; icon: LucideIcon; title: string; sub: string }) {
  return (
    <View style={{ flex: 1, gap: 10 }}>
      <Tile icon={icon} tone="sky" size={44} radius={22} />
      <View style={{ gap: 3 }}>
        <Txt v="small" color={C.skyPressed} style={{ fontFamily: F.semibold }}>
          Step {n}
        </Txt>
        <Txt v="bodyStrong" style={{ fontSize: 14.5, lineHeight: 19 }}>
          {title}
        </Txt>
        <Txt v="small" style={{ fontSize: 12.5, lineHeight: 17 }}>
          {sub}
        </Txt>
      </View>
    </View>
  );
}

function QuickAction({ icon, label, onPress, soon }: { icon: LucideIcon; label: string; onPress?: () => void; soon?: boolean }) {
  const body = (
    <Card pad={14} style={{ alignItems: 'center', gap: 10, borderRadius: R.lg, flex: 1 }}>
      <Tile icon={icon} tone="sky" size={44} radius={22} />
      <Txt v="smallStrong" center style={{ fontSize: 12.5, lineHeight: 16 }}>
        {label}
      </Txt>
    </Card>
  );
  if (!soon) {
    return (
      <Press onPress={onPress} label={label.replace('\n', ' ')} role="button" style={{ flex: 1 }}>
        {body}
      </Press>
    );
  }
  return (
    <View style={{ flex: 1 }} accessible accessibilityLabel={`${label.replace('\n', ' ')}, coming soon`} accessibilityState={{ disabled: true }}>
      <View pointerEvents="none" style={{ flex: 1, opacity: 0.5 }}>
        {body}
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', top: -10, left: 0, right: 0, alignItems: 'center' }}>
        <ComingSoon label="Soon" />
      </View>
    </View>
  );
}
