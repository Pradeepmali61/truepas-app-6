/** @jsxImportSource react */
import { Bell, Database, Fingerprint, Globe, Languages, Moon, ScanFace, Smartphone, Trash2, Vibrate } from 'lucide-react-native';

import { C } from '@/premium/theme';
import { go, Group, Heading, ListRow, Screen, Toggle, TopBar, Txt } from '@/premium/ui';

/** Settings — iOS-grade grouped list. */
export default function Settings() {
  return (
    <Screen header={<TopBar title="Settings" />} contentStyle={{ paddingTop: 4 }}>
      <Heading title="Make it" accent="yours." />
      <Group title="Check-in">
        <ListRow icon={ScanFace} tone="sky" title="Face check-in" sub="Use your face at partner venues" trailing={<Toggle on />} />
        <ListRow icon={Fingerprint} tone="sky" title="Biometric unlock" sub="Open the app with Face ID" trailing={<Toggle on />} />
        <ListRow icon={Smartphone} tone="sky" title="Auto-show pass nearby" sub="When you arrive at a booked venue" trailing={<Toggle />} />
      </Group>
      <Group title="Preferences">
        <ListRow icon={Bell} title="Notifications" value="All" />
        <ListRow icon={Vibrate} title="Haptics" trailing={<Toggle on />} />
        <ListRow icon={Moon} title="Appearance" value="Light" />
        <ListRow icon={Languages} title="Language" value="English" />
        <ListRow icon={Globe} title="Region" value="India" />
      </Group>
      <Group title="Privacy">
        <ListRow icon={Database} title="Your data" sub="Download or manage what we store" onPress={go('/legal/data-privacy')} />
        <ListRow icon={Trash2} danger title="Delete account" onPress={go('/account/delete')} />
      </Group>
      <Txt v="small" color={C.ink4} center>
        Truepas 3.0 (2026.10) · Made in India
      </Txt>
    </Screen>
  );
}
