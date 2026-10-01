/** @jsxImportSource react */
import { FileText, ScanFace, Trash2, Users } from 'lucide-react-native';
import { View } from 'react-native';

import { C, R } from '@/premium/theme';
import { Button, Chip, Field, go, Group, Heading, ListRow, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';

/** Delete account — honest about consequences, deliberate confirmation. */
export default function DeleteAccount() {
  return (
    <Screen
      header={<TopBar title="Delete account" />}
      contentStyle={{ paddingTop: 4 }}
      footer={
        <>
          <Button label="Delete my account" tone="danger" icon={Trash2} onPress={go('/account/delete/processing')} />
          <Button label="Keep my account" tone="ghost" />
        </>
      }>
      <Tile icon={Trash2} tone="red" size={60} />
      <Heading title="We're sorry to see you" accent="go." sub="Deleting your Truepas is permanent. Here's what will be removed:" />
      <Group>
        <ListRow icon={ScanFace} tone="red" title="Your face template" sub="Erased within 24 hours" chevron={false} />
        <ListRow icon={FileText} tone="red" title="3 verified documents" sub="Removed from your wallet" chevron={false} />
        <ListRow icon={Users} tone="red" title="Family of 4" sub="Members under 18 will be unlinked" chevron={false} />
      </Group>
      <View style={{ gap: 10 }}>
        <Txt v="smallStrong" color={C.ink2}>
          Mind telling us why? (optional)
        </Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="Privacy concerns" />
          <Chip label="Not using it" active />
          <Chip label="Too few venues" />
          <Chip label="Other" />
        </Row>
      </View>
      <View style={{ backgroundColor: C.redWash, borderRadius: R.lg, padding: 16 }}>
        <Field label='Type "DELETE" to confirm' value="DELETE" />
      </View>
    </Screen>
  );
}
