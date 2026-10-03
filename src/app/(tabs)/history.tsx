/** @jsxImportSource react */
/**
 * Check-ins tab — GET /cb/bookings split into Upcoming / Past, premium
 * journey list drilling into booking detail. The check-in event producer
 * isn't connected yet so an empty list is a valid production state, not an
 * error.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { CalendarClock } from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBookings } from '@/features/history/hooks';
import { TAB_BAR_SPACE } from '@/premium/blocks';
import { BookingRow, fmtMonthLabel, TabTitle, yearOf } from '@/premium/flows/home';
import { Async, ComingSoon, EmptyView, SkeletonList } from '@/premium/kit';
import { C, F, G, R } from '@/premium/theme';
import { Card, Chip, Divider, Row, Txt } from '@/premium/ui';
import type { Booking } from '@/types/domain';

export default function HistoryScreen() {
  const router = useRouter();
  const bookingsQuery = useBookings();
  const [view, setView] = useState<'upcoming' | 'past'>('upcoming');

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
              if (list.length === 0) {
                return (
                  <EmptyView
                    icon={CalendarClock}
                    title="No bookings yet"
                    body="History appears here after your first check-in."
                  />
                );
              }
              const upcomingList = list.filter((b) => b.status === 'upcoming');
              const past = list.filter((b) => b.status !== 'upcoming');
              /* Land on Past when there's nothing upcoming. */
              const effective = view === 'upcoming' && upcomingList.length === 0 ? 'past' : view;
              const shown = effective === 'upcoming' ? upcomingList : past;

              const groups: { label: string; items: Booking[] }[] = [];
              if (effective === 'upcoming') {
                groups.push({ label: 'Upcoming', items: shown });
              } else {
                for (const b of shown) {
                  const label = fmtMonthLabel(b.checkIn);
                  const g = groups.find((x) => x.label === label);
                  if (g) g.items.push(b);
                  else groups.push({ label, items: [b] });
                }
              }

              return (
                <>
                  <YearStats list={list} />

                  <Row gap={8} style={{ flexWrap: 'wrap' }}>
                    <Chip
                      label={`Upcoming (${upcomingList.length})`}
                      active={effective === 'upcoming'}
                      onPress={() => setView('upcoming')}
                    />
                    <Chip label={`Past (${past.length})`} active={effective === 'past'} onPress={() => setView('past')} />
                  </Row>

                  {shown.length === 0 ? (
                    <Card>
                      <EmptyView
                        compact
                        icon={CalendarClock}
                        title={effective === 'upcoming' ? 'No upcoming check-ins' : 'No past check-ins'}
                        body={
                          effective === 'upcoming'
                            ? 'Booked venues will show up here before your visit.'
                            : 'History appears here after your first check-in.'
                        }
                      />
                    </Card>
                  ) : (
                    groups.map((g) => (
                      <View key={g.label} style={{ gap: 10 }}>
                        <Row between>
                          <Txt v="h3" style={{ fontSize: 18 }}>
                            {g.label}
                          </Txt>
                          <Txt v="smallStrong" color={C.skyPressed}>
                            {g.items.length} {g.items.length === 1 ? 'visit' : 'visits'}
                          </Txt>
                        </Row>
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

/** Year-in-numbers header. Check-ins / places / guests come from the real
 *  bookings; timing stats have no backend yet and are marked as such. */
function YearStats({ list }: { list: Booking[] }) {
  const year = new Date().getFullYear();
  const done = list.filter((b) => b.status === 'completed' && yearOf(b.checkIn) === year);
  const places = new Set(done.map((b) => b.location.trim().toLowerCase())).size;
  const guests = done.reduce((n, b) => n + b.guests, 0);
  const stats: { v: string; k: string; soon?: boolean }[] = [
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
          Your {year} so far
        </Txt>
        <ComingSoon light label="Timing soon" />
      </Row>
      <Row between>
        {stats.map((s) => (
          <View key={s.k} style={{ gap: 2, opacity: s.soon ? 0.45 : 1 }}>
            <Text style={{ fontFamily: F.extrabold, fontSize: 26, letterSpacing: -0.8, color: C.white }}>{s.v}</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{s.k}</Text>
          </View>
        ))}
      </Row>
    </View>
  );
}
