/** @jsxImportSource react */
import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { KIND_ICON } from '@/premium/blocks';
import { FAMILY, PAST, UPCOMING } from '@/premium/data';
import { C } from '@/premium/theme';
import { Avatar, Badge, Card, Heading, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';

/** Member activity — vertical timeline. */
export default function Activity() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const m = FAMILY.find((x) => x.id === id) ?? FAMILY[0];
  const items = [PAST[0], PAST[1], UPCOMING[1], PAST[2], PAST[3]];
  return (
    <Screen header={<TopBar title="Activity" right={<Avatar src={m.image} size={36} />} />} contentStyle={{ paddingTop: 4 }}>
      <Heading title={`${m.name.split(' ')[0]}'s`} accent="journey." sub="Every face check-in, with time and place." />
      <View>
        {items.map((t, i) => (
          <Row key={t.id + i} gap={14} align="flex-start">
            <View style={{ alignItems: 'center', width: 44 }}>
              <Tile icon={KIND_ICON[t.kind]} tone={i === 0 ? 'navy' : 'sky'} size={44} radius={22} />
              {i < items.length - 1 && <View style={{ width: 2, flex: 1, minHeight: 40, backgroundColor: C.line, marginVertical: 6 }} />}
            </View>
            <Card style={{ flex: 1, gap: 6, marginBottom: 14 }} pad={16}>
              <Row between>
                <Txt v="bodyStrong">{t.title}</Txt>
                <Badge label={t.status === 'completed' ? '3.4s' : 'Upcoming'} tone={t.status === 'completed' ? 'green' : 'sky'} />
              </Row>
              <Txt v="small">{t.place}</Txt>
              <Txt v="small" color={C.ink4}>
                {t.when}
              </Txt>
            </Card>
          </Row>
        ))}
      </View>
    </Screen>
  );
}
