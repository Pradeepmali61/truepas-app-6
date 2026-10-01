/** @jsxImportSource react */
import { LinearGradient } from 'expo-linear-gradient';
import { KeyRound, Laptop, Lock, ScanFace, ShieldCheck, Smartphone } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Guilloche } from '@/premium/blocks';
import { C, F, G, R, SH } from '@/premium/theme';
import { Badge, go, Group, ListRow, Row, Screen, Toggle, TopBar } from '@/premium/ui';

/** Security — score ring hero + controls. */
export default function Security() {
  const size = 96;
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <Screen header={<TopBar title="Security" />} contentStyle={{ paddingTop: 4 }}>
      <View style={[{ borderRadius: R.xl, overflow: 'hidden', padding: 22 }, SH.navy]}>
        <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Guilloche size={360} style={{ right: -180, bottom: -200 }} />
        <Row gap={20}>
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
              <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={8} fill="none" />
              <Circle cx={size / 2} cy={size / 2} r={r} stroke={C.sky} strokeWidth={8} strokeLinecap="round" fill="none" strokeDasharray={`${circ * 0.92} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
            </Svg>
            <Text style={{ fontFamily: F.extrabold, fontSize: 28, letterSpacing: -1, color: C.white }}>92</Text>
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Badge label="Excellent" tone="glass" icon={ShieldCheck} />
            <Text style={{ fontFamily: F.bold, fontSize: 19, letterSpacing: -0.4, color: C.white }}>Your account is well protected</Text>
            <Text style={{ fontFamily: F.medium, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Turn on 2-step sign-in to reach 100.</Text>
          </View>
        </Row>
      </View>

      <Group title="Sign-in">
        <ListRow icon={ScanFace} tone="sky" title="Face" sub="Updated 12 Mar 2026" onPress={go('/face-update/pin')} />
        <ListRow icon={KeyRound} tone="sky" title="Change PIN" sub="4-digit app PIN" onPress={go('/security/change-pin')} />
        <ListRow icon={Lock} tone="sky" title="Change password" onPress={go('/security/change-password')} />
        <ListRow icon={ShieldCheck} tone="sky" title="2-step sign-in" sub="Recommended" trailing={<Toggle />} />
      </Group>
      <Group title="Signed-in devices">
        <ListRow icon={Smartphone} title="iPhone 16 Pro" sub="This device · Mumbai" trailing={<Badge label="Active" tone="green" dot />} />
        <ListRow icon={Laptop} title="MacBook Air · Safari" sub="Mumbai · 2 days ago" value="Sign out" chevron={false} />
      </Group>
    </Screen>
  );
}
