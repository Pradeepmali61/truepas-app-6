/** @jsxImportSource react */
/**
 * Member activity — GET /cb/family/{personId}/activity. The projection isn't
 * connected yet so this returns []; the empty state is the expected render,
 * events are not fabricated. Each event carries only a title and a date.
 */
import { useLocalSearchParams } from 'expo-router';
import { History, Users } from 'lucide-react-native';
import { View } from 'react-native';

import { useFamilyActivity, useFamilyMember } from '@/features/family/hooks';
import { Bone, EmptyView, ErrorView } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Avatar, Card, Heading, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';

function when(date: string): string {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleString();
}

function TimelineSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      {[0, 1, 2].map((i) => (
        <Row key={i} gap={14} align="flex-start">
          <Bone w={44} h={44} r={22} />
          <Card style={{ flex: 1, gap: 8 }} pad={16}>
            <Bone w="70%" />
            <Bone w="40%" h={11} />
          </Card>
        </Row>
      ))}
    </View>
  );
}

export default function FamilyMemberActivityScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const { data: member } = useFamilyMember(id);
  const activity = useFamilyActivity(id);
  const { data: events, isPending, isError, refetch } = activity;

  const fullName = name ?? member?.name;
  const first = (fullName ?? 'Member').split(' ')[0];

  return (
    <Screen
      header={<TopBar title="Activity" right={fullName ? <Avatar name={fullName} size={36} /> : undefined} />}
      contentStyle={{ paddingTop: 4, flexGrow: 1 }}
      refreshing={activity.isRefetching}
      onRefresh={() => void refetch()}>
      <Heading title={`${first}'s`} accent="activity." sub="Check-ins and verification events." />
      {isError ? (
        <ErrorView
          title="Couldn't load activity"
          body="Please check your connection and try again."
          onRetry={() => void refetch()}
        />
      ) : isPending ? (
        <TimelineSkeleton />
      ) : !events || events.length === 0 ? (
        <EmptyView
          icon={Users}
          title="No activity yet"
          body={`Check-ins and verification events for ${first} will appear here once venues start reporting them.`}
        />
      ) : (
        <View>
          {events.map((e, i) => (
            <Row key={e.id} gap={14} align="flex-start">
              <View style={{ alignItems: 'center', width: 44, alignSelf: 'stretch' }}>
                <Tile icon={History} tone={i === 0 ? 'navy' : 'sky'} size={44} radius={22} />
                {i < events.length - 1 && (
                  <View style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: C.line, marginVertical: 6 }} />
                )}
              </View>
              <Card style={{ flex: 1, gap: 4, marginBottom: 14 }} pad={16}>
                <Txt v="bodyStrong">{e.title}</Txt>
                <Txt v="small" color={C.ink4}>
                  {when(e.date)}
                </Txt>
              </Card>
            </Row>
          ))}
        </View>
      )}
    </Screen>
  );
}
