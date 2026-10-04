/** @jsxImportSource react */
/**
 * FamilyScreen — pushed route (Home → See all). One portrait card per member
 * (photo or initials, relationship, age, status) and an "Add photos" nudge
 * while any card has no photo; the empty
 * state and the sticky CTA push the add-member flow. Pull to refresh.
 * Premium skin over the original (0483c76) behaviour.
 */
import { useRouter } from 'expo-router';
import { Camera, UserPlus, Users } from 'lucide-react-native';
import { View } from 'react-native';

import { useFamily, useMembersWithoutPhoto } from '@/features/family/hooks';
import { MemberGrid, MemberGridSkeleton } from '@/premium/flows/family';
import { Async, EmptyView } from '@/premium/kit';
import { Button, Card, Heading, Screen, Tile, TopBar, Txt } from '@/premium/ui';
import type { FamilyMember } from '@/types/domain';

export default function FamilyScreen() {
  const router = useRouter();
  const members = useFamily();
  const addMember = () => router.push('/family/add' as never);
  const isEmpty = members.data?.length === 0;

  return (
    <Screen
      header={<TopBar title="Family" />}
      contentStyle={{ paddingTop: 4, flexGrow: 1 }}
      refreshing={members.isRefetching}
      onRefresh={() => void members.refetch()}
      footer={isEmpty ? undefined : <Button label="Add a family member" icon={UserPlus} onPress={addMember} />}>
      <Heading
        title="Travel"
        accent="together."
        sub="Everyone in your family checks in with their own face — kids included."
      />
      <Async
        q={members}
        skeleton={<MemberGridSkeleton />}
        empty={(list) => list.length === 0}
        emptyView={
          <EmptyView
            icon={Users}
            title="No family members"
            body="Add family to check them in with you at venues."
            action={<Button label="Add your first member" icon={UserPlus} full={false} onPress={addMember} />}
          />
        }>
        {(list) => (
          <View style={{ gap: 16 }}>
            <PhotoNudge members={list} />
            <MemberGrid members={list} onOpen={(m) => router.push(`/family/${m.id}` as never)} />
          </View>
        )}
      </Async>
    </Screen>
  );
}

/** Push to add photos: cards look like the approved design only with faces.
 *  Pending members get their photo from the face scan, others pick one. */
function PhotoNudge({ members }: { members: FamilyMember[] }) {
  const router = useRouter();
  const missing = useMembersWithoutPhoto(members);
  if (missing.length === 0) return null;
  const next = missing[0];
  const enrolled = next.faceEnrolled || next.verification === 'verified';
  return (
    <Card pad={16} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <Tile icon={Camera} tone="sky" size={44} />
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="bodyStrong">Add photos for your family</Txt>
        <Txt v="small">
          {missing.length === 1 ? `${next.name.split(' ')[0]}'s card has no photo yet` : `${missing.length} cards have no photo yet`}
        </Txt>
      </View>
      <Button
        label="Add"
        size="sm"
        tone="soft"
        full={false}
        onPress={() =>
          router.push({ pathname: '/family/[id]', params: enrolled ? { id: next.id, photo: '1' } : { id: next.id } } as never)
        }
      />
    </Card>
  );
}
