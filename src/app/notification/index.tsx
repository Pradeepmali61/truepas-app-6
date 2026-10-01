/** @jsxImportSource react */
import { BedDouble, FileText, FerrisWheel, ShieldAlert, Users } from 'lucide-react-native';
import { View } from 'react-native';

import { NOTIFICATIONS } from '@/premium/data';
import { C } from '@/premium/theme';
import { Card, Chip, Divider, go, Heading, Row, Screen, TextLink, Tile, TopBar, Txt } from '@/premium/ui';

const ICON = { checkin: BedDouble, family: Users, trip: FerrisWheel, security: ShieldAlert, doc: FileText } as const;
const TONE = { checkin: 'green', family: 'sky', trip: 'sky', security: 'amber', doc: 'neutral' } as const;

/** Inbox — grouped by day, unread marked with a sky dot. */
export default function Notifications() {
  const groups = [
    { t: 'Today', items: NOTIFICATIONS.slice(0, 3) },
    { t: 'Earlier', items: NOTIFICATIONS.slice(3) },
  ];
  return (
    <Screen header={<TopBar title="Notifications" right={<TextLink label="Read all" />} />} contentStyle={{ paddingTop: 4 }}>
      <Heading title="Stay in the" accent="loop." />
      <Row gap={8}>
        <Chip label="All" active />
        <Chip label="Check-ins" />
        <Chip label="Family" />
        <Chip label="Security" />
      </Row>
      {groups.map((g) => (
        <View key={g.t} style={{ gap: 10 }}>
          <Txt v="micro" style={{ marginLeft: 4 }}>
            {g.t}
          </Txt>
          <Card pad={0} style={{ paddingHorizontal: 16 }}>
            {g.items.map((n, i) => (
              <View key={n.id}>
                {i > 0 && <Divider inset={56} />}
                <Row gap={14} align="flex-start" style={{ paddingVertical: 16 }}>
                  <Tile icon={ICON[n.kind as keyof typeof ICON]} tone={TONE[n.kind as keyof typeof TONE]} size={42} radius={21} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Txt v="bodyStrong" style={{ lineHeight: 20 }}>
                      {n.title}
                    </Txt>
                    <Txt v="small" style={{ lineHeight: 19 }}>
                      {n.body}
                    </Txt>
                    {n.id === 'n4' && (
                      <View style={{ marginTop: 6 }}>
                        <TextLink label="Review sign-in" onPress={go('/security')} />
                      </View>
                    )}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <Txt v="small" color={C.ink4}>
                      {n.time}
                    </Txt>
                    {n.unread && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.sky }} />}
                  </View>
                </Row>
              </View>
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}
