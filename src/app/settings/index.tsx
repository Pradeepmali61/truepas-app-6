/** @jsxImportSource react */
/**
 * Settings — premium grouped list.
 *
 * The legacy screen here was Appearance only (light/dark, palette, colour
 * ratio, corner radius, field-label style). Those setters re-skin only the
 * legacy token theme; the premium UI is a fixed light design (static tokens
 * in premium/theme.ts, root StatusBar pinned to "dark"), so the controls no
 * longer change anything the user sees and are not offered. Appearance is
 * shown as "Light" with the mockup's other preferences, all marked
 * Coming soon until they have a backend / device implementation.
 *
 * Real rows: Your data (data & privacy), Security, Delete account.
 */
import {
  Bell,
  Database,
  Fingerprint,
  Globe,
  Languages,
  Moon,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Trash2,
  Vibrate,
} from 'lucide-react-native';

import { APP_VERSION, SoonSection } from '@/premium/flows/account';
import { C } from '@/premium/theme';
import { go, Group, Heading, ListRow, Screen, Toggle, TopBar, Txt } from '@/premium/ui';

export default function SettingsScreen() {
  return (
    <Screen header={<TopBar title="Settings" />} contentStyle={{ paddingTop: 4 }}>
      <Heading title="Make it" accent="yours." />

      <SoonSection title="Check-in">
        <ListRow icon={ScanFace} tone="sky" title="Face check-in" sub="Use your face at partner venues" trailing={<Toggle />} />
        <ListRow icon={Fingerprint} tone="sky" title="Biometric unlock" sub="Open the app with Face ID" trailing={<Toggle />} />
        <ListRow icon={Smartphone} tone="sky" title="Auto-show pass nearby" sub="When you arrive at a booked venue" trailing={<Toggle />} />
      </SoonSection>

      <SoonSection title="Preferences">
        <ListRow icon={Bell} title="Notification preferences" />
        <ListRow icon={Vibrate} title="Haptics" trailing={<Toggle />} />
        <ListRow icon={Moon} title="Appearance" value="Light" />
        <ListRow icon={Languages} title="Language" value="English" />
        <ListRow icon={Globe} title="Region" />
      </SoonSection>

      <Group title="Privacy">
        <ListRow icon={Database} title="Your data" sub="Retention, consent and deletion" onPress={go('/legal/data-privacy')} />
        <ListRow icon={ShieldCheck} title="Security & sign-in" sub="Face, PIN, password & consent" onPress={go('/security')} />
        <ListRow icon={Trash2} danger title="Delete account" onPress={go('/account/delete')} />
      </Group>

      <Txt v="small" color={C.ink4} center>
        Truepas {APP_VERSION}
      </Txt>
    </Screen>
  );
}
