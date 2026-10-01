/** @jsxImportSource react */
import { ArrowRight, CalendarDays, Globe, MapPin } from 'lucide-react-native';
import { View } from 'react-native';

import { C } from '@/premium/theme';
import { Button, Chip, Field, go, Heading, Row, Screen, Steps, TopBar, Txt } from '@/premium/ui';

/** Personal details — step 3 of setup. */
export default function AccountDetails() {
  return (
    <Screen
      header={<TopBar title="About you" right={<Txt v="smallStrong" color={C.ink3}>3/3</Txt>} />}
      contentStyle={{ paddingTop: 8 }}
      footer={<Button label="Continue to face setup" iconRight={ArrowRight} onPress={go('/(onboarding)/consent')} />}>
      <Steps total={3} current={2} />
      <Heading title="A few" accent="details." sub="These must match your government ID so venues can trust your Truepas." />
      <View style={{ gap: 18 }}>
        <Field label="Date of birth" icon={CalendarDays} value="14 Aug 1994" />
        <View style={{ gap: 8 }}>
          <Txt v="smallStrong" color={C.ink2}>
            Gender
          </Txt>
          <Row gap={8}>
            <Chip label="Male" active />
            <Chip label="Female" />
            <Chip label="Other" />
          </Row>
        </View>
        <Field label="Nationality" icon={Globe} value="Indian" />
        <Field label="City" icon={MapPin} value="Mumbai, Maharashtra" focused />
      </View>
    </Screen>
  );
}
