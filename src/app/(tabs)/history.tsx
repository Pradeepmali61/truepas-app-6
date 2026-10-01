/** @jsxImportSource react */
import { Search } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TAB_BAR_SPACE, TripRow } from '@/premium/blocks';
import { PAST, UPCOMING } from '@/premium/data';
import { C, F, G, R } from '@/premium/theme';
import { Card, Chip, Divider, go, IconCircle, Row, SectionHead, Txt } from '@/premium/ui';
import { LinearGradient } from 'expo-linear-gradient';

/** Check-ins — journey timeline with a year-in-numbers header. */
export default function History() {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: TAB_BAR_SPACE + 20, gap: 26 }}>
          <Row between>
            <Text style={{ fontFamily: F.extrabold, fontSize: 34, letterSpacing: -1.1, color: C.ink }}>Check-ins</Text>
            <IconCircle icon={Search} label="Search" />
          </Row>

          {/* stats */}
          <View style={{ borderRadius: R.xl, overflow: 'hidden', padding: 20, gap: 18 }}>
            <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            <Txt v="micro" color={C.skyLight}>
              Your 2026 so far
            </Txt>
            <Row between>
              {[
                { v: '24', k: 'Check-ins' },
                { v: '9', k: 'Cities' },
                { v: '3.1s', k: 'Avg. time' },
                { v: '6h', k: 'Saved' },
              ].map((s) => (
                <View key={s.k} style={{ gap: 2 }}>
                  <Text style={{ fontFamily: F.extrabold, fontSize: 26, letterSpacing: -0.8, color: C.white }}>{s.v}</Text>
                  <Text style={{ fontFamily: F.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{s.k}</Text>
                </View>
              ))}
            </Row>
          </View>

          <Row gap={8}>
            <Chip label="All" active />
            <Chip label="Hotels" />
            <Chip label="Travel" />
            <Chip label="Events" />
          </Row>

          <View style={{ gap: 8 }}>
            <SectionHead title="Upcoming" action={`${UPCOMING.length} trips`} />
            <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
              {UPCOMING.map((t, i) => (
                <View key={t.id}>
                  {i > 0 && <Divider inset={76} />}
                  <TripRow trip={t} onPress={go(`/booking/${t.id}`)} />
                </View>
              ))}
            </Card>
          </View>

          <View style={{ gap: 8 }}>
            <SectionHead title="September" />
            <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
              {PAST.map((t, i) => (
                <View key={t.id}>
                  {i > 0 && <Divider inset={76} />}
                  <TripRow trip={t} onPress={go(`/booking/${t.id}`)} />
                </View>
              ))}
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
