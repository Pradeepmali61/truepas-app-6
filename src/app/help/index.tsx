/** @jsxImportSource react */
import { ChevronDown, ChevronRight, MessageCircle, Phone, Search } from 'lucide-react-native';
import { View } from 'react-native';

import { C, R } from '@/premium/theme';
import { Card, Chip, Divider, Heading, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';

const FAQ = [
  {
    q: 'Where can I use face check-in?',
    a: 'At 2,400+ partner hotels, airports, theme parks, cinemas, stadiums and cruise terminals across India — look for the Truepas sign.',
    open: true,
  },
  { q: 'Is my face stored as a photo?', a: '' },
  { q: 'How do I add my child?', a: '' },
  { q: 'What if face check-in fails?', a: '' },
];

/** Help centre — search, topics, FAQ, human support. */
export default function Help() {
  return (
    <Screen header={<TopBar title="Help" />} contentStyle={{ paddingTop: 4 }}>
      <Heading title="How can we" accent="help?" />
      <View style={{ height: 54, borderRadius: R.full, backgroundColor: C.surface, borderWidth: 1, borderColor: C.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, gap: 12 }}>
        <Search size={19} color={C.ink3} />
        <Txt v="body" color={C.ink4}>
          Search questions
        </Txt>
      </View>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        <Chip label="Check-in" active />
        <Chip label="Face & privacy" />
        <Chip label="Family" />
        <Chip label="Documents" />
      </Row>
      <Card pad={0} style={{ paddingHorizontal: 18 }}>
        {FAQ.map((f, i) => (
          <View key={f.q}>
            {i > 0 && <Divider />}
            <View style={{ paddingVertical: 16, gap: 10 }}>
              <Row between>
                <Txt v="bodyStrong" style={{ flex: 1 }}>
                  {f.q}
                </Txt>
                {f.open ? <ChevronDown size={18} color={C.ink} /> : <ChevronRight size={18} color={C.ink4} />}
              </Row>
              {f.open && (
                <Txt v="body" style={{ lineHeight: 23 }}>
                  {f.a}
                </Txt>
              )}
            </View>
          </View>
        ))}
      </Card>
      <Row gap={12}>
        {[
          { icon: MessageCircle, t: 'Chat with us', s: 'Replies in ~2 min' },
          { icon: Phone, t: 'Call us', s: '24 × 7 support' },
        ].map((x) => (
          <Card key={x.t} style={{ flex: 1, gap: 12 }}>
            <Tile icon={x.icon} tone="navy" size={42} />
            <View>
              <Txt v="bodyStrong">{x.t}</Txt>
              <Txt v="small">{x.s}</Txt>
            </View>
          </Card>
        ))}
      </Row>
    </Screen>
  );
}
