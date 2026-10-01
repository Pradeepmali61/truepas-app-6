/** @jsxImportSource react */
import { ArrowRight, AtSign, Phone, User } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { C, F } from '@/premium/theme';
import { Button, Field, go, Heading, Row, Screen, Steps, TextLink, TopBar, Txt } from '@/premium/ui';

/** Create account — step 1 of a guided, three-step setup. */
export default function Register() {
  return (
    <Screen
      header={<TopBar title="Create account" right={<Txt v="smallStrong" color={C.ink3}>1/3</Txt>} />}
      contentStyle={{ paddingTop: 8 }}
      footer={
        <>
          <Button label="Continue" iconRight={ArrowRight} onPress={go('/(auth)/verify-phone')} />
          <Row gap={6} style={{ justifyContent: 'center', paddingVertical: 4 }}>
            <Txt v="body">Already have an account?</Txt>
            <TextLink label="Sign in" onPress={go('/(auth)/login')} />
          </Row>
        </>
      }>
      <Steps total={3} current={0} />
      <Heading title="Create your" accent="Truepas." sub="One verified identity for every hotel, flight, park and venue. Let's start with the basics." />
      <View style={{ gap: 18 }}>
        <Field label="Full name (as on your ID)" icon={User} value="Pradeep Mali" />
        <Field
          label="Mobile number"
          icon={Phone}
          value="98765 43210"
          focused
          right={<Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink3 }}>🇮🇳 +91</Text>}
          hint="We'll send a 6-digit code to verify it's you."
        />
        <Field label="Email" icon={AtSign} placeholder="you@example.com" />
      </View>
      <Row gap={12} align="flex-start">
        <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
          <Text style={{ color: C.white, fontFamily: F.bold, fontSize: 13 }}>✓</Text>
        </View>
        <Txt v="small" style={{ flex: 1, lineHeight: 19 }}>
          I agree to the <Text style={{ color: C.ink, fontFamily: F.bold }}>Terms of Service</Text> and{' '}
          <Text style={{ color: C.ink, fontFamily: F.bold }}>Privacy Policy</Text>, including how my biometric data is protected.
        </Txt>
      </Row>
    </Screen>
  );
}
