/** @jsxImportSource react */
import { LinearGradient } from 'expo-linear-gradient';
import { BadgeCheck, CalendarDays, FileText, Globe, MapPin, Phone, RefreshCw } from 'lucide-react-native';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glow, IdentityCard, PassCode } from '@/premium/blocks';
import { USER } from '@/premium/data';
import { C, F, G, R, SH } from '@/premium/theme';
import { Group, ListRow, Row, TopBar, Txt, go } from '@/premium/ui';

/** My Truepas — the scannable pass + identity details. */
export default function Identity() {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingBottom: 30 }}>
          <LinearGradient colors={G.night} style={StyleSheet.absoluteFill} />
          <Glow size={420} opacity={0.35} style={{ top: -120, left: -40 }} />
          <SafeAreaView edges={['top']}>
            <TopBar tone="glass" title="My Truepas" />
          </SafeAreaView>
          <View style={{ alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, gap: 18 }}>
            <View style={[{ backgroundColor: C.white, borderRadius: R.xxl, padding: 22, alignItems: 'center', gap: 14, width: '100%' }, SH.lg]}>
              <Row gap={8}>
                <BadgeCheck size={18} color={C.sky} />
                <Txt v="smallStrong">Show this at any Truepas venue</Txt>
              </Row>
              <PassCode size={208} />
              <Text style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: 3, color: C.ink }}>{USER.id}</Text>
              <Row gap={6}>
                <RefreshCw size={13} color={C.ink3} />
                <Txt v="small">Refreshes in 0:42 for your security</Txt>
              </Row>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, gap: 26, marginTop: 4 }}>
          <IdentityCard />
          <Group title="Verified details">
            <ListRow icon={CalendarDays} title="Date of birth" value={USER.dob} chevron={false} />
            <ListRow icon={Globe} title="Nationality" value={USER.nationality} chevron={false} />
            <ListRow icon={MapPin} title="City" value="Mumbai" chevron={false} />
            <ListRow icon={Phone} title="Mobile" value="+91 •••• 43210" chevron={false} />
          </Group>
          <Group title="Linked documents">
            <ListRow icon={FileText} tone="sky" title="Passport" sub="Verified · Exp. Jan 2033" onPress={go('/document/d1')} />
            <ListRow icon={FileText} tone="sky" title="Aadhaar" sub="Verified · •••• 7730" onPress={go('/document/d2')} />
            <ListRow icon={FileText} tone="sky" title="Driving Licence" sub="Verified · Exp. Aug 2034" onPress={go('/document/d3')} />
          </Group>
        </View>
      </ScrollView>
    </View>
  );
}
