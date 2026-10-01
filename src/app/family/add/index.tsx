/** @jsxImportSource react */
import { ArrowRight, CalendarDays, User } from 'lucide-react-native';
import { View } from 'react-native';

import { C } from '@/premium/theme';
import { Button, Chip, Field, go, Heading, Row, Screen, Steps, TopBar, Txt } from '@/premium/ui';

/** Add member — step 1: who are they. */
export default function AddMember() {
  return (
    <Screen
      header={<TopBar title="Add member" right={<Txt v="smallStrong" color={C.ink3}>1/4</Txt>} />}
      contentStyle={{ paddingTop: 8 }}
      footer={<Button label="Continue" iconRight={ArrowRight} onPress={go('/family/add/document')} />}>
      <Steps total={4} current={0} />
      <Heading title="Who's joining" accent="you?" sub="They'll get their own verified identity, linked to your family." />
      <View style={{ gap: 10 }}>
        <Txt v="smallStrong" color={C.ink2}>
          Relationship
        </Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          <Chip label="Spouse" />
          <Chip label="Child" active />
          <Chip label="Parent" />
          <Chip label="Sibling" />
          <Chip label="Other" />
        </Row>
      </View>
      <View style={{ gap: 18 }}>
        <Field label="Full name" icon={User} value="Kiara Mali" focused />
        <Field label="Date of birth" icon={CalendarDays} value="3 Mar 2019" hint="Members under 18 check in with a guardian." />
      </View>
    </Screen>
  );
}
