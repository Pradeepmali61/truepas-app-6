/** @jsxImportSource react */
import { LinearGradient } from 'expo-linear-gradient';
import { FileText, Globe, Lock, Star } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Glow, Guilloche, Wordmark } from '@/premium/blocks';
import { C, F, G } from '@/premium/theme';
import { go, Group, ListRow, Serif, TopBar, Txt } from '@/premium/ui';

/** About — brand moment + links. */
export default function About() {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <View style={{ paddingBottom: 40, overflow: 'hidden' }}>
        <LinearGradient colors={G.night} style={StyleSheet.absoluteFill} />
        <Glow size={420} opacity={0.4} style={{ top: -60, left: -20 }} />
        <Guilloche size={520} style={{ left: -60, top: -120 }} />
        <SafeAreaView edges={['top']}>
          <TopBar tone="glass" />
        </SafeAreaView>
        <View style={{ alignItems: 'center', gap: 14, paddingTop: 24 }}>
          <Wordmark light size={36} />
          <Text style={{ fontFamily: F.semibold, fontSize: 17, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
            Your face is your <Serif size={22} color={C.skyLight}>pass.</Serif>
          </Text>
          <Txt v="small" color="rgba(255,255,255,0.5)">
            Version 3.0 · Build 2026.10
          </Txt>
        </View>
      </View>
      <View style={{ padding: 20, gap: 24 }}>
        <Group>
          <ListRow icon={Star} tone="sky" title="Rate Truepas" />
          <ListRow icon={Globe} tone="sky" title="truepas.app" />
        </Group>
        <Group title="Legal">
          <ListRow icon={FileText} title="Terms of Service" onPress={go('/legal/terms')} />
          <ListRow icon={Lock} title="Privacy Policy" onPress={go('/legal/privacy-policy')} />
          <ListRow icon={FileText} title="Biometric data policy" onPress={go('/legal/data-privacy')} />
        </Group>
        <Txt v="small" color={C.ink4} center>
          © 2026 Truepas · Crafted in Mumbai
        </Txt>
      </View>
    </View>
  );
}
