/** @jsxImportSource react */
/**
 * Settings — real device settings first:
 * - Security: App lock (fingerprint / face unlock on open, expo-local-
 *   authentication) and a shortcut to Security & sign-in.
 * - Feedback: Haptics on/off (all vibration goes through services/haptics).
 * - Phone permissions: notifications, camera and photos open the system
 *   settings page for Truepas.
 * Then account, support and legal links. Face check-in at venues and
 * languages have no backend yet and stay marked Coming soon.
 */
import {
  Bell,
  Camera,
  CircleHelp,
  Database,
  FileText,
  Fingerprint,
  Info,
  Languages,
  Lock,
  Pencil,
  ScanFace,
  ShieldCheck,
  Trash2,
  Vibrate,
} from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Platform } from 'react-native';

import { biometricsAvailable, confirmWithBiometrics, markUnlocked } from '@/features/settings/AppLock';
import { useToast } from '@/hooks/useToast';
import { APP_VERSION, SoonSection } from '@/premium/flows/account';
import { C } from '@/premium/theme';
import { go, Group, Heading, ListRow, Screen, Toggle, TopBar, Txt } from '@/premium/ui';
import { selectHaptic } from '@/services/haptics';
import { setPref, usePref } from '@/services/prefs';

export default function SettingsScreen() {
  const toast = useToast();
  const appLock = usePref('appLock');
  const haptics = usePref('haptics');
  const [busy, setBusy] = useState(false);
  const native = Platform.OS !== 'web';

  const toggleAppLock = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!next) {
        await setPref('appLock', false);
        return;
      }
      if (!(await biometricsAvailable())) {
        toast.show('error', 'Set up fingerprint or face unlock on your phone first.');
        return;
      }
      if (await confirmWithBiometrics('Turn on app lock')) {
        markUnlocked();
        await setPref('appLock', true);
        toast.show('success', 'App lock is on');
      }
    } finally {
      setBusy(false);
    }
  };

  const toggleHaptics = async (next: boolean) => {
    await setPref('haptics', next);
    if (next) selectHaptic();
  };

  const openPhoneSettings = () => {
    Linking.openSettings().catch(() => toast.show('error', "Couldn't open your phone settings."));
  };

  return (
    <Screen header={<TopBar title="Settings" />} contentStyle={{ paddingTop: 4 }}>
      <Heading title="Make it" accent="yours." />

      <Group title="Security">
        <ListRow
          icon={Fingerprint}
          tone="sky"
          title="App lock"
          sub={native ? 'Unlock Truepas with your fingerprint or face' : 'Available in the mobile app'}
          trailing={<Toggle on={appLock} disabled={!native || busy} onChange={(v) => void toggleAppLock(v)} label="App lock" />}
          chevron={false}
        />
        <ListRow icon={ShieldCheck} tone="sky" title="Security & sign-in" sub="Face, PIN, password & consent" onPress={go('/security')} />
      </Group>

      <Group title="Feedback">
        <ListRow
          icon={Vibrate}
          tone="sky"
          title="Haptics"
          sub="Gentle vibration on taps, codes and scans"
          trailing={<Toggle on={haptics} onChange={(v) => void toggleHaptics(v)} label="Haptics" />}
          chevron={false}
        />
      </Group>

      <Group title="Phone permissions">
        <ListRow icon={Bell} tone="sky" title="Notifications" sub="Check-in and family alerts" onPress={openPhoneSettings} />
        <ListRow icon={Camera} tone="sky" title="Camera & photos" sub="Face scans, documents and family photos" onPress={openPhoneSettings} />
      </Group>

      <SoonSection title="On the way">
        <ListRow icon={ScanFace} tone="sky" title="Face check-in at venues" sub="Check in with a look at partner venues" trailing={<Toggle />} />
        <ListRow icon={Languages} title="Language" value="English" />
      </SoonSection>

      <Group title="Account">
        <ListRow icon={Pencil} title="Edit profile" onPress={go('/profile/edit')} />
        <ListRow icon={Database} title="Biometric data & privacy" sub="Retention, consent and deletion" onPress={go('/legal/data-privacy')} />
        <ListRow icon={Trash2} danger title="Delete account" onPress={go('/account/delete')} />
      </Group>

      <Group title="Support & legal">
        <ListRow icon={CircleHelp} title="Help & FAQ" sub="Answers and contact support" onPress={go('/help')} />
        <ListRow icon={Info} title="About Truepas" onPress={go('/about')} />
        <ListRow icon={Lock} title="Privacy Policy" onPress={go('/legal/privacy-policy')} />
        <ListRow icon={FileText} title="Terms of Service" onPress={go('/legal/terms')} />
      </Group>

      <Txt v="small" color={C.ink4} center>
        Truepas {APP_VERSION}
      </Txt>
    </Screen>
  );
}
