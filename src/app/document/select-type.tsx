/** @jsxImportSource react */
import { LinearGradient } from 'expo-linear-gradient';
import { BookUser, Car, ChevronRight, CreditCard, Fingerprint, Globe2 } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { C, F, R, SH } from '@/premium/theme';
import { Badge, go, Heading, Press, Row, Screen, TopBar, Txt } from '@/premium/ui';

const TYPES = [
  { icon: BookUser, t: 'Passport', s: 'Best for travel · international', colors: ['#0B3A5B', '#021B2B'], tag: 'Recommended' },
  { icon: Fingerprint, t: 'Aadhaar', s: 'Instant e-KYC via UIDAI', colors: ['#08B6FC', '#0574A8'] },
  { icon: Car, t: 'Driving Licence', s: 'All Indian states', colors: ['#3A4A57', '#1A252E'] },
  { icon: CreditCard, t: 'PAN Card', s: 'For financial venues', colors: ['#5A6B78', '#34424D'] },
  { icon: Globe2, t: 'National ID', s: '190+ countries supported', colors: ['#0E5A6E', '#06303B'] },
] as const;

/** Choose a document — each type as a miniature card. */
export default function SelectType() {
  return (
    <Screen header={<TopBar title="Add document" />} contentStyle={{ paddingTop: 4 }}>
      <Heading title="Which ID do you" accent="have?" sub="We read it automatically and verify it against the issuing authority." />
      <View style={{ gap: 12 }}>
        {TYPES.map((d) => (
          <Press key={d.t} onPress={go('/document/scan')} style={[{ borderRadius: R.lg }, SH.sm]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: C.surface, borderRadius: R.lg, padding: 14, borderWidth: 1, borderColor: C.lineSoft }}>
              <View style={{ width: 62, height: 44, borderRadius: 9, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
                <LinearGradient colors={d.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
                <View>
                  <d.icon size={20} color={C.white} />
                </View>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Row gap={8}>
                  <Text style={{ fontFamily: F.bold, fontSize: 15.5, color: C.ink }}>{d.t}</Text>
                  {'tag' in d && <Badge label={d.tag} tone="sky" />}
                </Row>
                <Txt v="small">{d.s}</Txt>
              </View>
              <ChevronRight size={18} color={C.ink4} />
            </View>
          </Press>
        ))}
      </View>
    </Screen>
  );
}
