/** @jsxImportSource react */
import { EyeOff, Fingerprint, LockKeyhole, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

import { FaceRing } from '@/premium/blocks';
import { C } from '@/premium/theme';
import { Button, Card, Divider, go, Heading, Row, Screen, TextLink, Tile, TopBar, Txt } from '@/premium/ui';

/** Biometric consent — trust first, CLEAR-style. */
export default function Consent() {
  const points = [
    { icon: LockKeyhole, title: 'Encrypted end-to-end', body: 'Your face becomes a mathematical template — never stored as a photo.' },
    { icon: EyeOff, title: 'Never sold or shared', body: 'Venues only receive a yes/no match. Never your image.' },
    { icon: Trash2, title: 'Delete anytime', body: 'Remove your biometric data in one tap from Settings.' },
  ];
  return (
    <Screen
      header={<TopBar title="Face setup" />}
      footer={
        <>
          <Button label="I agree, set up my face" icon={Fingerprint} onPress={go('/(onboarding)/face-scan')} />
          <Row style={{ justifyContent: 'center', paddingVertical: 4 }}>
            <TextLink label="Read our biometric policy" onPress={go('/legal/data-privacy')} />
          </Row>
        </>
      }>
      <View style={{ alignItems: 'center', marginTop: -6, marginBottom: -14 }}>
        <FaceRing size={170} mode="idle" photo={false} />
      </View>
      <Heading title="Your face," accent="your control." center sub="Set up face check-in once. Use it at every hotel, gate and venue — privately." />
      <Card pad={4} style={{ paddingHorizontal: 18 }}>
        {points.map((p, i) => (
          <View key={p.title}>
            {i > 0 && <Divider inset={58} />}
            <Row gap={14} style={{ paddingVertical: 16 }} align="flex-start">
              <Tile icon={p.icon} tone="sky" size={44} />
              <View style={{ flex: 1, gap: 3 }}>
                <Txt v="bodyStrong">{p.title}</Txt>
                <Txt v="small" style={{ lineHeight: 19 }}>
                  {p.body}
                </Txt>
              </View>
            </Row>
          </View>
        ))}
      </Card>
      <Txt v="small" color={C.ink4} center>
        Compliant with India's DPDP Act 2023 and GDPR.
      </Txt>
    </Screen>
  );
}
