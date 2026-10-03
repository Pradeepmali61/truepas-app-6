/** @jsxImportSource react */
/**
 * FamilyScreen — pushed route (Home → See all). One portrait card per member
 * (relationship, age, status, capture mode, age band, cameras); the empty
 * state and the sticky CTA push the add-member flow. Pull to refresh.
 * Premium skin over the original (0483c76) behaviour.
 */
import { useRouter } from 'expo-router';
import { UserPlus, Users } from 'lucide-react-native';

import { useFamily } from '@/features/family/hooks';
import { MemberGrid, MemberGridSkeleton } from '@/premium/flows/family';
import { Async, EmptyView } from '@/premium/kit';
import { Button, Heading, Screen, TopBar } from '@/premium/ui';

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
        {(list) => <MemberGrid members={list} onOpen={(m) => router.push(`/family/${m.id}` as never)} />}
      </Async>
    </Screen>
  );
}
