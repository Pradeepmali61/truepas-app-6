/** @jsxImportSource react */
import { Check, Eye, Lock } from 'lucide-react-native';
import { View } from 'react-native';

import { C } from '@/premium/theme';
import { Button, Card, Field, Heading, Row, Screen, TopBar, Txt } from '@/premium/ui';

/** Change password — with live strength checklist. */
export default function ChangePassword() {
  const rules = [
    { t: 'At least 10 characters', ok: true },
    { t: 'One uppercase letter', ok: true },
    { t: 'One number', ok: true },
    { t: 'One symbol', ok: false },
  ];
  return (
    <Screen header={<TopBar title="Password" />} contentStyle={{ paddingTop: 8 }} footer={<Button label="Update password" />}>
      <Heading title="A new" accent="password." sub="Choose something you don't use anywhere else." />
      <View style={{ gap: 18 }}>
        <Field label="Current password" icon={Lock} value="oldpassword1" secure />
        <Field label="New password" icon={Lock} value="Truepas2026" secure focused right={<Eye size={19} color={C.ink3} />} />
      </View>
      <Card style={{ gap: 12 }}>
        <Row between>
          <Txt v="smallStrong">Strength</Txt>
          <Txt v="smallStrong" color={C.green}>
            Strong
          </Txt>
        </Row>
        <Row gap={6}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < 3 ? C.green : C.line }} />
          ))}
        </Row>
        {rules.map((r) => (
          <Row key={r.t} gap={10}>
            <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: r.ok ? C.greenWash : C.sunken, alignItems: 'center', justifyContent: 'center' }}>
              {r.ok && <Check size={12} color={C.greenInk} strokeWidth={3} />}
            </View>
            <Txt v="body" color={r.ok ? C.ink : C.ink3}>
              {r.t}
            </Txt>
          </Row>
        ))}
      </Card>
    </Screen>
  );
}
