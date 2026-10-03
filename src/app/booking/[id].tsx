/** @jsxImportSource react */
/**
 * Booking detail — GET /cb/bookings/{bookingId}. Photo header with venue +
 * location, then the real facts (check-in / check-out, guests, amount,
 * status, checked-in members). The digital key and venue services in the
 * approved design have no backend yet and are shown as "Coming soon".
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import {
  BellRing,
  CalendarDays,
  Car,
  Coffee,
  Map as MapIcon,
  MapPin,
  Sparkles,
  Ticket,
  Users,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBooking } from '@/features/history/hooks';
import { Guilloche, PassCode } from '@/premium/blocks';
import {
  BookingBackdrop,
  BookingTypeIcon,
  bookingKind,
  bookingTypeLabel,
  Fact,
  fmtDay,
  money,
  StatusBadge,
  whenLabel,
  yearOf,
} from '@/premium/flows/home';
import { Async, EmptyView, SoonOverlay } from '@/premium/kit';
import { C, F, G, R, SH } from '@/premium/theme';
import { Avatar, Card, Divider, Group, ListRow, Row, Screen, SectionHead, TopBar, Txt } from '@/premium/ui';
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
  const kind = bookingKind(b.type);
  const stay = kind === 'hotel' || kind === 'cruise';
  const members = b.checkedInMembers ?? [];
  const progress = Math.min(1, members.length / Math.max(b.guests, 1));
  const checkInYear = yearOf(b.checkIn);
  const checkOutYear = yearOf(b.checkOut);

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

          {/* ---------- digital key (no backend yet) ---------- */}
          <SoonOverlay light>
            <View style={[{ borderRadius: R.xl, overflow: 'hidden', padding: 20 }, SH.navy]}>
              <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
              <Guilloche size={380} style={{ right: -190, top: -190 }} />
              <Row between align="flex-start">
                <View style={{ gap: 4, flex: 1, paddingRight: 12 }}>
                  <Text style={{ fontFamily: F.semibold, fontSize: 12, letterSpacing: 1.3, color: C.skyLight, marginTop: 34 }}>
                    {stay ? 'DIGITAL KEY' : 'FACE PASS'}
                  </Text>
                  <Text style={{ fontFamily: F.extrabold, fontSize: 28, letterSpacing: -1, color: C.white }}>Face entry</Text>
                  <Text style={{ fontFamily: F.medium, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                    {stay ? 'Your face opens your room.' : 'Walk in with your face — no tickets.'}
                  </Text>
                </View>
                <View style={{ backgroundColor: C.white, padding: 10, borderRadius: 18 }}>
                  <PassCode size={104} />
                </View>
              </Row>
            </View>
          </SoonOverlay>

          {/* ---------- venue services (no backend yet) ---------- */}
          <SoonOverlay>
            {stay ? (
              <Group title="Stay services">
                <ListRow icon={Coffee} tone="sky" title="In-room dining" sub="Order to your room" />
                <ListRow icon={Sparkles} tone="sky" title="Spa & wellness" sub="Book a treatment" />
                <ListRow icon={Car} tone="sky" title="Airport transfer" sub="Arrange a ride" />
                <ListRow icon={Wifi} tone="sky" title="Wi-Fi" sub="Connect automatically" />
                <ListRow icon={BellRing} tone="sky" title="Request housekeeping" />
              </Group>
            ) : (
              <Group title="Your visit">
                <ListRow icon={MapIcon} tone="sky" title="Map & directions" sub={b.location} />
                <ListRow icon={UtensilsCrossed} tone="sky" title="Food & drinks" sub="Order ahead, pay with your face" />
                <ListRow icon={Ticket} tone="sky" title="Add-ons & upgrades" />
              </Group>
            )}
          </SoonOverlay>
        </View>
      </ScrollView>
    </View>
  );
}
