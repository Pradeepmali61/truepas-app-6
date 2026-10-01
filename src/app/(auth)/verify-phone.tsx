/** @jsxImportSource react */
import { View } from 'react-native';

import { Keypad } from '@/premium/blocks';
import { C } from '@/premium/theme';
import { Button, CodeCells, go, Heading, Row, Screen, Steps, TextLink, TopBar, Txt } from '@/premium/ui';

/** OTP — six cells, live cursor, built-in keypad. */
export default function VerifyPhone() {
  return (
    <Screen
      scroll={false}
      header={<TopBar title="Verify mobile" right={<Txt v="smallStrong" color={C.ink3}>2/3</Txt>} />}
      contentStyle={{ paddingTop: 8, gap: 28 }}>
      <Steps total={3} current={1} />
      <Heading title="Enter the" accent="code." sub="We sent a 6-digit code to +91 98765 43210." />
      <View style={{ gap: 18 }}>
        <CodeCells value="4821" />
        <Row gap={6} style={{ justifyContent: 'center' }}>
          <Txt v="small">Didn't get it?</Txt>
          <Txt v="smallStrong" color={C.ink4}>
            Resend in 0:24
          </Txt>
        </Row>
      </View>
      <View style={{ flex: 1 }} />
      <Keypad />
      <View style={{ paddingBottom: 12, gap: 10 }}>
        <Button label="Verify" onPress={go('/(auth)/verify-email')} />
        <Row style={{ justifyContent: 'center' }}>
          <TextLink label="Change number" onPress={go('/(auth)/register')} />
        </Row>
      </View>
    </Screen>
  );
}
