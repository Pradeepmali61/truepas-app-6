/** @jsxImportSource react */
import { Bell, FileScan, KeyRound, QrCode, ScanFace, UserPlus } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IdentityCard, JourneyCard, JourneyHero, TAB_BAR_SPACE, TripRow } from '@/premium/blocks';
import { FAMILY, PAST, UPCOMING, USER } from '@/premium/data';
import { C, F, R } from '@/premium/theme';
import { Avatar, Button, Card, Divider, go, IconCircle, Press, Row, SectionHead, Serif, Tile, Txt } from '@/premium/ui';

/** Home — "My identity + my journey": greeting, identity, today's check-in, what's next. */
export default function Home() {
  const [today, ...next] = UPCOMING;
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + 20, gap: 30 }}>
          {/* greeting */}
          <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 22 }}>
            <Row between>
              <Press onPress={go('/profile')}>
                <Row gap={12}>
                  <Avatar src="user" size={46} ring />
                  <View>
                    <Txt v="small">Good evening</Txt>
                    <Txt v="h3" style={{ fontSize: 19 }}>
                      {USER.first}
                    </Txt>
                  </View>
                </Row>
              </Press>
              <Row gap={10}>
                <IconCircle icon={QrCode} label="Show pass" onPress={go('/identity')} />
                <IconCircle icon={Bell} label="Notifications" dot onPress={go('/notification')} />
              </Row>
            </Row>

            <Text style={{ fontFamily: F.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1, color: C.ink }}>
              Where are you{'\n'}going <Serif size={40} color={C.sky}>today?</Serif>
            </Text>

            <IdentityCard compact onPress={go('/identity')} />
          </View>

          {/* today — the primary moment */}
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <SectionHead title="Today" action="Details" onAction={go(`/booking/${today.id}`)} />
            <JourneyHero
              trip={today}
              onPress={go(`/booking/${today.id}`)}
              cta={<Button label="Check in with your face" icon={ScanFace} onPress={go('/face-update/camera')} />}
            />
          </View>

          {/* coming up */}
          <View style={{ gap: 16 }}>
            <View style={{ paddingHorizontal: 20 }}>
              <SectionHead title="Coming up" action="See all" onAction={go('/(tabs)/history')} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 16 }}>
              {next.map((t) => (
                <JourneyCard key={t.id} trip={t} onPress={go(`/booking/${t.id}`)} />
              ))}
            </ScrollView>
          </View>

          {/* quick actions */}
          <View style={{ paddingHorizontal: 20, gap: 16, marginTop: -14 }}>
            <SectionHead title="Quick actions" />
            <Row gap={10}>
              {[
                { icon: FileScan, label: 'Add\ndocument', href: '/document/select-type' },
                { icon: UserPlus, label: 'Add\nfamily', href: '/family/add' },
                { icon: QrCode, label: 'Share\nidentity', href: '/identity' },
                { icon: KeyRound, label: 'Digital\nkeys', href: `/booking/${today.id}` },
              ].map((a) => (
                <Press key={a.label} onPress={go(a.href)} style={{ flex: 1 }}>
                  <Card pad={14} style={{ alignItems: 'center', gap: 10, borderRadius: R.lg }}>
                    <Tile icon={a.icon} tone="sky" size={44} radius={22} />
                    <Txt v="smallStrong" center style={{ fontSize: 12.5, lineHeight: 16 }}>
                      {a.label}
                    </Txt>
                  </Card>
                </Press>
              ))}
            </Row>
          </View>

          {/* family */}
          <View style={{ paddingHorizontal: 20, gap: 16 }}>
            <SectionHead title="Travelling together" action="Manage" onAction={go('/family')} />
            <Card pad={18}>
              <Row between>
                <Row gap={0}>
                  {FAMILY.map((m, i) => (
                    <View key={m.id} style={{ marginLeft: i === 0 ? 0 : -12, borderRadius: 30, borderWidth: 3, borderColor: C.surface }}>
                      <Avatar src={m.image} size={46} />
                    </View>
                  ))}
                </Row>
                <Press onPress={go('/family/add')}>
                  <View style={{ width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.ink4, alignItems: 'center', justifyContent: 'center' }}>
                    <UserPlus size={19} color={C.ink2} />
                  </View>
                </Press>
              </Row>
              <Divider style={{ marginVertical: 16 }} />
              <Row between>
                <View style={{ gap: 2 }}>
                  <Txt v="bodyStrong">4 family members</Txt>
                  <Txt v="small">3 verified · 1 awaiting face scan</Txt>
                </View>
                <View style={{ height: 8, width: 92, borderRadius: 4, backgroundColor: C.sunken, overflow: 'hidden' }}>
                  <View style={{ width: '75%', height: '100%', backgroundColor: C.sky, borderRadius: 4 }} />
                </View>
              </Row>
            </Card>
          </View>

          {/* recent */}
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            <SectionHead title="Recent check-ins" action="History" onAction={go('/(tabs)/history')} />
            <Card pad={0} style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
              {PAST.slice(0, 3).map((t, i) => (
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
