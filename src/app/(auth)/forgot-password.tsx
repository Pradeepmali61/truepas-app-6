/** @jsxImportSource react */
import { AtSign, KeyRound, ScanFace } from 'lucide-react-native';
import { View } from 'react-native';

import { C, R } from '@/premium/theme';
import { Button, Field, go, Heading, Row, Screen, Tile, TopBar, Txt } from '@/premium/ui';

/** Forgot password — reset by link, or skip it entirely with your face. */
export default function ForgotPassword() {
  return (
    <Screen
      header={<TopBar />}
      contentStyle={{ paddingTop: 8 }}
      footer={<Button label="Send reset link" onPress={go('/(auth)/verify-email')} />}>
      <Tile icon={KeyRound} tone="sky" size={60} />
      <Heading title="Reset your" accent="password." sub="Enter the email linked to your Truepas. We'll send you a secure reset link." />
      <Field label="Email" icon={AtSign} value="pradeep.mali@example.com" focused />
      <View style={{ backgroundColor: C.skyMist, borderRadius: R.lg, padding: 16, borderWidth: 1, borderColor: C.skyWash }}>
        <Row gap={14}>
          <Tile icon={ScanFace} tone="navy" size={44} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="bodyStrong">Faster: recover with your face</Txt>
            <Txt v="small">Verify it's you in 2 seconds — no email needed.</Txt>
          </View>
        </Row>
      </View>
    </Screen>
  );
}
