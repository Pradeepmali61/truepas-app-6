/** @jsxImportSource react */
import { Bell, CircleHelp, FileText, Info, LogOut, QrCode, Settings, ShieldCheck, Users } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { USER } from '@/premium/data';
import { C, F } from '@/premium/theme';
import { Avatar, Badge, Button, Card, go, Group, IconCircle, ListRow, Row, Screen, TopBar, Txt } from '@/premium/ui';

/** Profile — person first, then everything else in calm groups. */
export default function Profile() {
  return (
    <Screen header={<TopBar title="Profile" right={<IconCircle icon={QrCode} label="Show pass" onPress={go('/identity')} />} />} contentStyle={{ paddingTop: 4 }}>
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Avatar src="user" size={108} ring status="verified" />
        <View style={{ alignItems: 'center', gap: 4 }}>
          <Text style={{ fontFamily: F.extrabold, fontSize: 28, letterSpacing: -0.8, color: C.ink }}>{USER.name}</Text>
          <Txt v="small">{USER.email}</Txt>
        </View>
        <Row gap={8}>
          <Badge label="Identity verified" tone="green" icon={ShieldCheck} />
          <Badge label={USER.id} tone="neutral" />
        </Row>
        <Button label="Edit profile" tone="white" size="sm" full={false} onPress={go('/profile/edit')} />
      </View>

      <Card pad={18} style={{ flexDirection: 'row' }}>
        {[
          { v: '24', k: 'Check-ins' },
          { v: '4', k: 'Family' },
          { v: '3', k: 'Documents' },
        ].map((s, i) => (
          <View key={s.k} style={{ flex: 1, alignItems: 'center', gap: 2, borderLeftWidth: i ? 1 : 0, borderLeftColor: C.lineSoft }}>
            <Text style={{ fontFamily: F.extrabold, fontSize: 24, letterSpacing: -0.6, color: C.ink }}>{s.v}</Text>
            <Txt v="small">{s.k}</Txt>
          </View>
        ))}
      </Card>

      <Group title="Account">
        <ListRow icon={Users} tone="sky" title="Family" sub="4 members" onPress={go('/family')} />
        <ListRow icon={ShieldCheck} tone="sky" title="Security" sub="Face, PIN & password" onPress={go('/security')} />
        <ListRow icon={Bell} tone="sky" title="Notifications" onPress={go('/notification')} />
        <ListRow icon={Settings} tone="sky" title="Settings" onPress={go('/settings')} />
      </Group>
      <Group title="Support">
        <ListRow icon={CircleHelp} title="Help centre" onPress={go('/help')} />
        <ListRow icon={FileText} title="Privacy & data" onPress={go('/legal/data-privacy')} />
        <ListRow icon={Info} title="About Truepas" value="v3.0" onPress={go('/about')} />
      </Group>
      <ListRow icon={LogOut} danger title="Sign out" chevron={false} onPress={go('/(auth)/welcome')} />
    </Screen>
  );
}
