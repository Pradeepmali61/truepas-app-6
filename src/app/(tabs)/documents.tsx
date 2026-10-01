/** @jsxImportSource react */
import { Plus, ShieldCheck } from 'lucide-react-native';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocCard, TAB_BAR_SPACE } from '@/premium/blocks';
import { DOCS } from '@/premium/data';
import { C, F, R } from '@/premium/theme';
import { Badge, Card, Chip, go, IconCircle, Row, SectionHead, Serif, Tile, Txt } from '@/premium/ui';

/** Wallet — identity documents as a fanned card stack (Apple Wallet feel). */
export default function Wallet() {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: TAB_BAR_SPACE + 20, gap: 26 }}>
          <Row between>
            <Text style={{ fontFamily: F.extrabold, fontSize: 34, letterSpacing: -1.1, color: C.ink }}>
              Wallet
            </Text>
            <IconCircle icon={Plus} tone="sky" label="Add document" onPress={go('/document/select-type')} />
          </Row>

          <Card pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Tile icon={ShieldCheck} tone="green" size={46} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="bodyStrong">3 of 4 documents verified</Txt>
              <Txt v="small">Your identity strength is excellent</Txt>
            </View>
            <Text style={{ fontFamily: F.extrabold, fontSize: 22, color: C.green }}>92</Text>
          </Card>

          <Row gap={8}>
            <Chip label="All" active />
            <Chip label="Identity" />
            <Chip label="Travel" />
            <Chip label="Driving" />
          </Row>

          {/* fanned stack */}
          <View style={{ height: 196 + 3 * 74 }}>
            {DOCS.map((d, i) => (
              <View key={d.id} style={{ position: 'absolute', left: 0, right: 0, top: i * 74 }}>
                <DocCard doc={d} onPress={go(`/document/${d.id}`)} />
              </View>
            ))}
          </View>

          <SectionHead title="Add more to your wallet" />
          <Row gap={12}>
            {[
              { t: 'Voter ID', s: 'Election Commission' },
              { t: 'Visa', s: 'Any country' },
            ].map((x) => (
              <Card key={x.t} onPress={go('/document/select-type')} style={{ flex: 1, gap: 12, borderStyle: 'dashed', borderColor: C.line, borderWidth: 1.5 }} flat>
                <View style={{ width: 36, height: 36, borderRadius: R.sm, backgroundColor: C.skyWash, alignItems: 'center', justifyContent: 'center' }}>
                  <Plus size={18} color={C.skyPressed} />
                </View>
                <View>
                  <Txt v="bodyStrong">{x.t}</Txt>
                  <Txt v="small">{x.s}</Txt>
                </View>
              </Card>
            ))}
          </Row>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Badge label="Stored with AES-256 · on-device keys" tone="neutral" icon={ShieldCheck} />
            <Txt v="small" color={C.ink4} center>
              Documents are only shared when <Serif size={15} color={C.ink3}>you</Serif> approve.
            </Txt>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
