/** @jsxImportSource react */
/**
 * Booking detail — GET /cb/bookings/{bookingId}. Photo header with venue +
 * location, then the real facts (check-in / check-out, guests, amount,
 * status, checked-in members). The approved design's QR key becomes a Face
 * check-in card (when it opens + whose faces are ready), and venue services
 * (no data in the API) become "Before you go": real readiness rows plus
 * directions and sharing that work today.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, FileCheck, MapPin, Navigation, ScanFace, Share2, Users, UsersRound } from 'lucide-react-native';
import { Linking, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useBooking } from '@/features/history/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { Guilloche } from '@/premium/blocks';
import {
  BookingBackdrop,
  BookingTypeIcon,
  bookingTypeLabel,
  Fact,
  fmtDay,
  money,
  StatusBadge,
  statusLabel,
  TravellerStack,
  whenLabel,
  yearOf,
} from '@/premium/flows/home';
import { Async, EmptyView } from '@/premium/kit';
import { C, F, G, R, SH } from '@/premium/theme';
import { Avatar, Badge, Card, Divider, Group, ListRow, Row, Screen, SectionHead, TopBar, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';
import type { Booking } from '@/types/domain';

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const booking = useBooking(id ?? '');

  if (booking.data == null) {
    return (
      <Screen header={<TopBar title="Booking" />}>
        <Async
          q={booking}
          emptyView={
            <EmptyView icon={CalendarDays} title="Booking not found" body="This booking is no longer available." />
          }
        >
          {() => null}
        </Async>
      </Screen>
    );
  }

  return <BookingDetail b={booking.data} />;
}

function BookingDetail({ b }: { b: Booking }) {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { url: avatarUri } = useProfilePicture();
  const family = useFamily().data ?? [];
  const docs = useDocuments().data ?? [];

  const upcoming = b.status === 'upcoming';
  const members = b.checkedInMembers ?? [];
  const progress = Math.min(1, members.length / Math.max(b.guests, 1));
  const checkInYear = yearOf(b.checkIn);
  const checkOutYear = yearOf(b.checkOut);

  /* Face check-in card */
  const faceEnrolled = !!user?.faceEnrolled;
  const you = { name: user?.fullName, uri: avatarUri, faceEnrolled };
  const travellers = 1 + family.length;
  const ready = (faceEnrolled ? 1 : 0) + family.filter((m) => m.faceEnrolled).length;
  const pending = family.find((m) => !m.faceEnrolled);
  const when = whenLabel(b.checkIn);
  const entry =
    b.status === 'completed'
      ? { title: 'Checked in', sub: `${members.length} of ${b.guests} guests checked in with their face.` }
      : upcoming
        ? {
            title: when === 'Today' ? 'Opens today' : `Opens ${fmtDay(b.checkIn)}`,
            sub: `Just look at the camera at ${b.venue}.`,
          }
        : { title: statusLabel(b.status), sub: 'Face check-in is closed for this booking.' };

  /* Before you go: ID row */
  const verifiedDoc = docs.find((d) => d.status === 'verified');
  const pendingDoc = docs.find((d) => d.status === 'pending');
  const idRow = verifiedDoc
    ? { done: true, tone: 'green' as const, title: 'ID verified', sub: verifiedDoc.label, href: '' }
    : pendingDoc
      ? { done: false, tone: 'amber' as const, title: 'ID in review', sub: pendingDoc.label, href: '/(tabs)/documents' }
      : { done: false, tone: 'amber' as const, title: 'Add an ID', sub: 'Passport, ID card or licence', href: '/document/select-type' };

  const place = `${b.venue}, ${b.location}`;
  const openDirections = () => {
    const q = encodeURIComponent(place);
    const url = Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `https://www.google.com/maps/search/?api=1&query=${q}`;
    void Linking.openURL(url).catch(() => {});
  };
  const shareBooking = () => {
    const lines = [
      `${b.venue} · ${bookingTypeLabel(b.type)}`,
      b.location,
      `Check-in ${fmtDay(b.checkIn)}${checkInYear != null ? ` ${checkInYear}` : ''}`,
      `Check-out ${fmtDay(b.checkOut)}${checkOutYear != null ? ` ${checkOutYear}` : ''}`,
      `${b.guests} ${b.guests === 1 ? 'guest' : 'guests'}`,
    ];
    void Share.share({ message: lines.join('\n') }).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ---------- photo header ---------- */}
        <View style={{ height: 340 }}>
          <BookingBackdrop b={b} iconSize={72} />
          <LinearGradient
            colors={['rgba(1,27,39,0.45)', 'rgba(1,27,39,0)', 'rgba(1,27,39,0.75)']}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']}>
            <TopBar tone="glass" />
          </SafeAreaView>
          <View style={{ position: 'absolute', left: 20, right: 20, bottom: 52, gap: 6 }}>
            <Row gap={8}>
              <BookingTypeIcon type={b.type} size={15} color={C.skyLight} />
              <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.skyLight }}>{bookingTypeLabel(b.type)}</Text>
            </Row>
            <Text style={{ fontFamily: F.extrabold, fontSize: 32, letterSpacing: -1, color: C.white }} numberOfLines={2}>
              {b.venue}
            </Text>
            <Row gap={6}>
              <MapPin size={14} color="rgba(255,255,255,0.8)" />
              <Text style={{ fontFamily: F.medium, fontSize: 14, color: 'rgba(255,255,255,0.8)', flexShrink: 1 }} numberOfLines={1}>
                {b.location}
              </Text>
            </Row>
          </View>
        </View>

        <View
          style={{
            marginTop: -28,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            backgroundColor: C.canvas,
            paddingHorizontal: 20,
            paddingTop: 22,
            gap: 26,
          }}
        >
          <Row between>
            <StatusBadge status={b.status} dot />
            <Txt v="smallStrong" color={C.ink3}>
              {whenLabel(b.checkIn)}
            </Txt>
          </Row>

          {/* ---------- facts ---------- */}
          <Card pad={0}>
            <Row style={{ padding: 18 }} align="flex-start">
              <Fact k="Check-in" v={fmtDay(b.checkIn)} sub={checkInYear != null ? String(checkInYear) : undefined} />
              <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: C.lineSoft, marginHorizontal: 16 }} />
              <Fact k="Check-out" v={fmtDay(b.checkOut)} sub={checkOutYear != null ? String(checkOutYear) : undefined} />
            </Row>
            <Divider />
            <Row style={{ padding: 18 }} align="flex-start">
              <Fact k="Guests">
                <Text style={{ fontFamily: F.mono, fontSize: 17, color: C.ink }}>{b.guests}</Text>
              </Fact>
              <View style={{ width: 1, alignSelf: 'stretch', backgroundColor: C.lineSoft, marginHorizontal: 16 }} />
              <Fact k="Amount">
                <Text style={{ fontFamily: F.mono, fontSize: 17, color: C.ink }}>{money(b.amount)}</Text>
              </Fact>
            </Row>
            <Divider />
            <View style={{ padding: 18, gap: 10 }}>
              <Row between>
                <Row gap={10}>
                  <Users size={18} color={C.ink3} />
                  <Txt v="body">Checked-in members</Txt>
                </Row>
                <Text style={{ fontFamily: F.mono, fontSize: 15, color: C.ink }}>
                  {members.length}/{b.guests}
                </Text>
              </Row>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: C.sunken, overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 3, backgroundColor: C.sky }} />
              </View>
            </View>
          </Card>

          {/* ---------- who's checked in ---------- */}
          <View style={{ gap: 14 }}>
            <SectionHead title="Checked in" />
            <Card pad={16}>
              {members.length === 0 ? (
                <Txt v="small">No one has checked in yet.</Txt>
              ) : (
                <View style={{ gap: 12 }}>
                  {members.map((name, i) => (
                    <Row key={`${name}-${i}`} gap={12}>
                      <Avatar name={name} size={40} status="verified" />
                      <Txt v="bodyStrong" lines={1} style={{ flex: 1 }}>
                        {name}
                      </Txt>
                    </Row>
                  ))}
                </View>
              )}
            </Card>
          </View>

          {/* ---------- face check-in (replaces the QR key: the face is the key) ---------- */}
          <View style={[{ borderRadius: R.xl, overflow: 'hidden', padding: 20, gap: 18 }, SH.navy]}>
            <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Guilloche size={380} style={{ right: -190, top: -190 }} />
            <Row between align="flex-start">
              <View style={{ gap: 4, flex: 1, paddingRight: 12 }}>
                <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 1.3, color: C.skyLight }}>FACE CHECK-IN</Text>
                <Text style={{ fontFamily: F.extrabold, fontSize: 28, letterSpacing: -1, color: C.white }}>{entry.title}</Text>
                <Text style={{ fontFamily: F.medium, fontSize: 13, lineHeight: 18, color: 'rgba(255,255,255,0.7)' }}>{entry.sub}</Text>
              </View>
              <View style={{ backgroundColor: C.white, width: 92, height: 92, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
                <ScanFace size={46} color={C.sky} strokeWidth={1.6} />
              </View>
            </Row>
            {upcoming && (
              <>
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.14)' }} />
                <Row between gap={12}>
                  <TravellerStack you={you} members={family} />
                  <View style={{ alignItems: 'flex-end', flexShrink: 1 }}>
                    <Text style={{ fontFamily: F.mono, fontSize: 15, color: C.white }}>
                      {ready}/{travellers}
                    </Text>
                    <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>faces ready</Text>
                  </View>
                </Row>
              </>
            )}
          </View>

          {/* ---------- before you go / your visit: only actions that work today ---------- */}
          {upcoming ? (
            <Group title="Before you go">
              <ListRow
                icon={ScanFace}
                tone={faceEnrolled ? 'green' : 'amber'}
                title={faceEnrolled ? 'Face enrolled' : 'Enrol your face'}
                sub={faceEnrolled ? 'Your face is your key' : 'Needed to check in with a look'}
                trailing={faceEnrolled ? <Badge label="Done" tone="green" /> : undefined}
                chevron={!faceEnrolled}
                onPress={faceEnrolled ? undefined : () => router.push('/face-update/pin' as never)}
              />
              <ListRow
                icon={FileCheck}
                tone={idRow.tone}
                title={idRow.title}
                sub={idRow.sub}
                trailing={idRow.done ? <Badge label="Done" tone="green" /> : undefined}
                chevron={!idRow.done}
                onPress={idRow.done ? undefined : () => router.push(idRow.href as never)}
              />
              <ListRow
                icon={UsersRound}
                tone={family.length === 0 ? 'sky' : pending ? 'amber' : 'green'}
                title={family.length === 0 ? 'Travelling with family?' : `Family faces ${ready - (faceEnrolled ? 1 : 0)} of ${family.length}`}
                sub={
                  family.length === 0
                    ? 'Add them to check in together'
                    : pending
                      ? `${pending.name.split(' ')[0]} still needs a face scan`
                      : 'Everyone can check in with you'
                }
                trailing={family.length > 0 && !pending ? <Badge label="Done" tone="green" /> : undefined}
                chevron={family.length === 0 || !!pending}
                onPress={
                  family.length === 0
                    ? () => router.push('/family/add' as never)
                    : pending
                      ? () => router.push(`/family/${pending.id}` as never)
                      : undefined
                }
              />
              <ListRow icon={Navigation} tone="sky" title="Directions" sub={b.location} onPress={openDirections} />
              <ListRow icon={Share2} tone="sky" title="Share booking" sub="Send the details to anyone" onPress={shareBooking} />
            </Group>
          ) : (
            <Group title="Your visit">
              <ListRow icon={Navigation} tone="sky" title="Directions" sub={b.location} onPress={openDirections} />
              <ListRow icon={Share2} tone="sky" title="Share booking" sub="Send the details to anyone" onPress={shareBooking} />
            </Group>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
