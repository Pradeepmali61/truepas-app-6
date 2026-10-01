/** @jsxImportSource react */
import { ArrowRight, Eye, Lock, Phone, ScanFace } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { C, F, R } from '@/premium/theme';
import { Button, Field, go, Heading, Row, Screen, TextLink, TopBar, Txt } from '@/premium/ui';

/** Sign in — quiet, confident form with a face sign-in shortcut. */
export default function Login() {
  return (
    <Screen
      header={<TopBar />}
      contentStyle={{ paddingTop: 8 }}
      footer={
        <Row gap={6} style={{ justifyContent: 'center', paddingBottom: 4 }}>
          <Txt v="body">New to Truepas?</Txt>
          <TextLink label="Create an account" onPress={go('/(auth)/register')} />
        </Row>
      }>
      <Heading title="Welcome" accent="back." sub="Sign in to your digital identity. It takes a few seconds." />

      {/* method switch */}
      <View style={{ flexDirection: 'row', backgroundColor: C.sunken, borderRadius: R.full, padding: 4 }}>
        {['Mobile', 'Email'].map((m, i) => (
          <View
            key={m}
            style={[
              { flex: 1, height: 42, borderRadius: R.full, alignItems: 'center', justifyContent: 'center' },
              i === 0 && { backgroundColor: C.surface, boxShadow: '0px 2px 8px rgba(10,30,42,0.08)' },
            ]}>
            <Text style={{ fontFamily: F.bold, fontSize: 14, color: i === 0 ? C.ink : C.ink3 }}>{m}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 18 }}>
        <Field
          label="Mobile number"
          icon={Phone}
          value="98765 43210"
          focused
          right={<Text style={{ fontFamily: F.bold, fontSize: 14, color: C.ink3 }}>🇮🇳 +91</Text>}
        />
        <Field label="Password" icon={Lock} value="truepas2026" secure right={<Eye size={19} color={C.ink3} />} />
        <Row between>
          <Row gap={10}>
            <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: C.sky, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: C.white, fontFamily: F.bold, fontSize: 13 }}>✓</Text>
            </View>
            <Txt v="body" color={C.ink2}>
              Keep me signed in
            </Txt>
          </Row>
          <TextLink label="Forgot password?" onPress={go('/(auth)/forgot-password')} />
        </Row>
      </View>

      <View style={{ gap: 14 }}>
        <Button label="Sign in" iconRight={ArrowRight} onPress={go('/(tabs)')} />
        <Row gap={12}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
          <Txt v="small">or</Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
        </Row>
        <Button label="Sign in with your face" tone="white" icon={ScanFace} onPress={go('/face-update/camera')} />
      </View>
    </Screen>
  );
}
