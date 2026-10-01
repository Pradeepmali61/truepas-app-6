/** @jsxImportSource react */
import { ExternalLink, MailCheck } from 'lucide-react-native';
import { View } from 'react-native';

import { USER } from '@/premium/data';
import { C } from '@/premium/theme';
import { Button, Card, go, Row, TextLink, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** Email confirmation — calm, single-purpose. */
export default function VerifyEmail() {
  return (
    <ResultView
      icon={MailCheck}
      over="Almost there"
      title="Check your"
      accent="inbox."
      sub="Tap the secure link we just sent to confirm your email. It expires in 15 minutes."
      primary={<Button label="Open mail app" icon={ExternalLink} onPress={go('/(auth)/account-details')} />}
      secondary={
        <Row style={{ justifyContent: 'center', paddingVertical: 6 }}>
          <TextLink label="Resend email" />
        </Row>
      }>
      <Card style={{ gap: 4, alignItems: 'center' }}>
        <Txt v="small">Sent to</Txt>
        <Txt v="bodyStrong">{USER.email}</Txt>
      </Card>
      <View style={{ alignItems: 'center' }}>
        <Txt v="small" color={C.ink4} center style={{ maxWidth: 280 }}>
          Can't find it? Check your spam or promotions folder.
        </Txt>
      </View>
    </ResultView>
  );
}
