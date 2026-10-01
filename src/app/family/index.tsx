/** @jsxImportSource react */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, UserPlus } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { FAMILY } from '@/premium/data';
import { IMG } from '@/premium/images';
import { C, F, R, SH } from '@/premium/theme';
import { Badge, Button, Card, go, Heading, Press, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';

/** Family — portrait cards (Disney "party" feel), one tap to each member. */
export default function Family() {
  return (
    <Screen header={<TopBar title="Family" />} contentStyle={{ paddingTop: 4 }} footer={<Button label="Add a family member" icon={UserPlus} onPress={go('/family/add')} />}>
      <Heading title="Travel" accent="together." sub="Everyone in your circle checks in with their own face — kids included, under your supervision." />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {FAMILY.map((m) => (
          <Press key={m.id} onPress={go(`/family/${m.id}`)} style={[{ width: '48%', flexGrow: 1, borderRadius: R.xl }, SH.md]}>
            <View style={{ height: 228, borderRadius: R.xl, overflow: 'hidden', padding: 14, justifyContent: 'space-between' }}>
              <Image source={IMG[m.image]} style={StyleSheet.absoluteFill} contentFit="cover" />
              <LinearGradient colors={['rgba(1,27,39,0)', 'rgba(1,27,39,0.85)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
              <View style={{ alignSelf: 'flex-end' }}>
                {m.status === 'verified' ? <Badge label="Verified" tone="green" dot /> : <Badge label="Face pending" tone="amber" dot />}
              </View>
              <View>
                <Text style={{ fontFamily: F.bold, fontSize: 17, color: C.white }}>{m.name.split(' ')[0]}</Text>
                <Text style={{ fontFamily: F.medium, fontSize: 12.5, color: 'rgba(255,255,255,0.72)' }}>
                  {m.relation} · {m.age} yrs
                </Text>
              </View>
            </View>
          </Press>
        ))}
      </View>

      <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <Tile icon={ShieldCheck} tone="sky" size={46} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="bodyStrong">Guardian controls on</Txt>
          <Txt v="small">Kiara (7) can only check in alongside an adult.</Txt>
        </View>
      </Card>
      <Row gap={6} style={{ justifyContent: 'center' }}>
        <Txt v="small" color={C.ink4}>
          Up to 8 members per family plan
        </Txt>
      </Row>
    </Screen>
  );
}
