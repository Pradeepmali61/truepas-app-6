/** @jsxImportSource react */
/**
 * Check-ins tab — GET /cb/bookings filtered by the approved design's
 * category chips (All / Hotels / Travel / Events), Upcoming first and past
 * visits by month, drilling into booking detail. The check-in event producer
 * isn't connected yet so an empty list is a valid production state, not an
 * error: the year card then shows the account's readiness and the list shows
 * how a check-in works for the selected category.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useBookings } from '@/features/history/hooks';
import { TAB_BAR_SPACE } from '@/premium/blocks';
import { BookingRow, bookingKind, FirstCheckInRow, fmtMonthLabel, TabTitle, yearOf } from '@/premium/flows/home';
import { IMG, type ImgKey } from '@/premium/images';
import { Async, ComingSoon, SkeletonList } from '@/premium/kit';
import { C, F, G, R } from '@/premium/theme';
import { Badge, Card, Chip, Divider, Row, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';
import type { Booking } from '@/types/domain';

type Cat = 'all' | 'hotels' | 'travel' | 'events';

const CATS: { id: Cat; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hotels', label: 'Hotels' },
  { id: 'travel', label: 'Travel' },
  { id: 'events', label: 'Events' },
];

/** Booking.type → chip. Unknown kinds only appear under All. */
function catOf(b: Booking): Cat | null {
  const k = bookingKind(b.type);
  if (k === 'hotel') return 'hotels';
  if (k === 'flight' || k === 'cruise') return 'travel';
  if (k === 'event' || k === 'park') return 'events';
  return null;
}

export default function HistoryScreen() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const bookingsQuery = useBookings();
  const documents = useDocuments();
  const family = useFamily();
  const [cat, setCat] = useState<Cat>('all');

  /* Tabs stay mounted, so switching back would show the cached list. Refetch
     on every re-focus so a check-in completed meanwhile shows up (BUG018);
     the first focus is covered by the query's own mount fetch. */
  const { refetch } = bookingsQuery;
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) void refetch();
      focusedOnce.current = true;
    }, [refetch]),
  );

  const open = (b: Booking) => () => router.push(`/booking/${b.id}` as never);

  const readiness = {
    faceEnrolled: !!user?.faceEnrolled,
    ids: (documents.data ?? []).filter((d) => d.status === 'verified').length,
    travellers: 1 + (family.data?.length ?? 0),
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={bookingsQuery.isRefetching}
              onRefresh={() => void bookingsQuery.refetch()}
              tintColor={C.sky}
              colors={[C.sky]}
            />
          }
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: TAB_BAR_SPACE + 20, gap: 26, flexGrow: 1 }}
        >
          <TabTitle>Check-ins</TabTitle>

          <Async q={bookingsQuery} skeleton={<SkeletonList rows={4} thumb={62} />}>
            {(list) => {
              const count = (c: Cat) => (c === 'all' ? list.length : list.filter((b) => catOf(b) === c).length);
              const filtered = cat === 'all' ? list : list.filter((b) => catOf(b) === cat);
              const upcoming = filtered
                .filter((b) => b.status === 'upcoming')
                .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
              const past = filtered.filter((b) => b.status !== 'upcoming');

              const groups: { label: string; items: Booking[] }[] = [];
              if (upcoming.length > 0) groups.push({ label: 'Upcoming', items: upcoming });
              for (const b of past) {
                const label = fmtMonthLabel(b.checkIn);
                const g = groups.find((x) => x.label === label);
                if (g) g.items.push(b);
                else groups.push({ label, items: [b] });
              }

              return (
                <>
                  <YearStats list={list} readiness={readiness} />

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0, marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
                  >
                    {CATS.map((c) => {
                      const n = count(c.id);
                      return (
                        <Chip
                          key={c.id}
                          label={n > 0 ? `${c.label} (${n})` : c.label}
                          active={cat === c.id}
                          onPress={() => setCat(c.id)}
                        />
                      );
                    })}
                  </ScrollView>

                  {groups.length === 0 ? (
                    <CheckInGuide cat={cat} />
                  ) : (
                    groups.map((g) => (
                      <View key={g.label} style={{ gap: 10 }}>
                        <GroupHead title={g.label} note={`${g.items.length} ${g.items.length === 1 ? 'visit' : 'visits'}`} />
                        <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
                          {g.items.map((b, i) => (
                            <View key={b.id}>
                              {i > 0 && <Divider inset={76} />}
                              <BookingRow b={b} onPress={open(b)} />
                            </View>
                          ))}
                        </Card>
                      </View>
                    ))
                  )}
                </>
              );
            }}
          </Async>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function GroupHead({ title, note }: { title: string; note: string }) {
  return (
    <Row between>
      <Txt v="h3" style={{ fontSize: 18 }}>
        {title}
      </Txt>
      <Txt v="smallStrong" color={C.skyPressed}>
        {note}
      </Txt>
    </Row>
  );
}

/* ───────────────────────── empty list: how a check-in works ───────────────────────── */

type GuideStep = { photo: ImgKey; title: string; sub: string };

const GUIDES: Record<Cat, { title: string; first?: boolean; steps: GuideStep[] }> = {
  all: {
    title: 'Getting started',
    first: true,
    steps: [
      { photo: 'hotelPool', title: 'Book a partner venue', sub: 'Hotels, parks, flights and events' },
      { photo: 'resort', title: 'Look at the camera', sub: 'No ID card, no forms to fill' },
      { photo: 'themepark', title: 'Walk in together', sub: 'Your family checks in with you' },
    ],
  },
  hotels: {
    title: 'Checking in at a hotel',
    steps: [
      { photo: 'hotelNight', title: 'Skip the front desk', sub: 'Go straight to the lobby kiosk' },
      { photo: 'hotelDusk', title: 'Look at the kiosk camera', sub: 'Your face confirms the booking' },
      { photo: 'room', title: 'Head to your room', sub: 'No paperwork at arrival' },
    ],
  },
  travel: {
    title: 'Checking in to travel',
    steps: [
      { photo: 'flight', title: 'Arrive at the gate', sub: 'Your verified ID is already linked' },
      { photo: 'cruise', title: 'Face match at boarding', sub: 'Your face confirms it’s you' },
      { photo: 'mumbai', title: 'Board with your family', sub: 'Members check in alongside you' },
    ],
  },
  events: {
    title: 'Checking in at events',
    steps: [
      { photo: 'themepark', title: 'Walk up to the entry', sub: 'No tickets to dig out' },
      { photo: 'concert', title: 'Look at the entry camera', sub: 'Your face is matched to the booking' },
      { photo: 'stadium', title: 'Bring the kids', sub: 'Family members enter with you' },
    ],
  },
};

function CheckInGuide({ cat }: { cat: Cat }) {
  const g = GUIDES[cat];
  return (
    <View style={{ gap: 10 }}>
      <GroupHead title={g.title} note="Before your first visit" />
      <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
        {g.first && <FirstCheckInRow />}
        {g.steps.map((s, i) => (
          <View key={s.title}>
            {(i > 0 || g.first) && <Divider inset={76} />}
            <GuideRow step={s} n={i + 1} />
          </View>
        ))}
      </Card>
    </View>
  );
}

/** Same layout as BookingRow: photo thumbnail, two lines, badge. */
function GuideRow({ step, n }: { step: GuideStep; n: number }) {
  return (
    <View
      accessible
      accessibilityLabel={`Step ${n}: ${step.title}. ${step.sub}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}
    >
      <View style={{ width: 62, height: 62, borderRadius: 16, overflow: 'hidden' }}>
        <Image source={IMG[step.photo]} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Txt v="bodyStrong" lines={2}>
          {step.title}
        </Txt>
        <Txt v="small" lines={2}>
          {step.sub}
        </Txt>
      </View>
      <Badge label={`Step ${n}`} tone="sky" />
    </View>
  );
}

/* ───────────────────────── year card ───────────────────────── */

/** Year-in-numbers header. Check-ins / places / guests come from the real
 *  bookings; timing stats have no backend yet and are marked as such. Before
 *  the year's first check-in it shows the account's real readiness instead. */
function YearStats({
  list,
  readiness,
}: {
  list: Booking[];
  readiness: { faceEnrolled: boolean; ids: number; travellers: number };
}) {
  const year = new Date().getFullYear();
  const done = list.filter((b) => b.status === 'completed' && yearOf(b.checkIn) === year);
  const fresh = done.length === 0;
  const places = new Set(done.map((b) => b.location.trim().toLowerCase())).size;
  const guests = done.reduce((n, b) => n + b.guests, 0);
  const stats: { v: string; k: string; soon?: boolean }[] = fresh
    ? [
        { v: readiness.faceEnrolled ? '✓' : '—', k: 'Face ID' },
        { v: String(readiness.ids), k: readiness.ids === 1 ? 'ID' : 'IDs' },
        { v: String(readiness.travellers), k: readiness.travellers === 1 ? 'Traveller' : 'Travellers' },
        { v: '0', k: 'Check-ins' },
      ]
    : [
        { v: String(done.length), k: 'Check-ins' },
        { v: String(places), k: places === 1 ? 'Place' : 'Places' },
        { v: String(guests), k: 'Guests' },
        { v: '—', k: 'Avg. time', soon: true },
      ];
  return (
    <View style={{ borderRadius: R.xl, overflow: 'hidden', padding: 20, gap: 18 }}>
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Row between>
        <Txt v="micro" color={C.skyLight}>
          {fresh ? `Your ${year} starts here` : `Your ${year} so far`}
        </Txt>
        {!fresh && <ComingSoon light label="Timing soon" />}
      </Row>
      <Row between>
        {stats.map((s) => (
          <View key={s.k} style={{ gap: 2, opacity: s.soon ? 0.45 : 1 }}>
            <Text style={{ fontFamily: F.extrabold, fontSize: 26, letterSpacing: -0.8, color: C.white }}>{s.v}</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{s.k}</Text>
          </View>
        ))}
      </Row>
      {fresh && (
        <Text style={{ fontFamily: F.medium, fontSize: 13, color: 'rgba(255,255,255,0.72)', marginTop: -4 }}>
          Every check-in this year adds up here.
        </Text>
      )}
    </View>
  );
}
