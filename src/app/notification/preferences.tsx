/** @jsxImportSource react */
/**
 * Notification preferences — GET/PUT /cb/user/me/notification-preferences.
 * Four push categories; each toggle sends only its own key (optimistic, rolls
 * back on error). Off stops push only: the inbox still records the item.
 * `security` covers both account and identity notifications.
 */
import { CalendarClock, FileText, type LucideIcon, ShieldCheck, Users } from 'lucide-react-native';
import { View } from 'react-native';

import { useNotificationPreferences, useUpdateNotificationPreferences } from '@/features/notifications/hooks';
import { useToast } from '@/hooks/useToast';
import { Async, Bone } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Card, Divider, Group, Heading, ListRow, Screen, Toggle, TopBar, Txt } from '@/premium/ui';
import type { NotificationPreferences } from '@/types/domain';

const ROWS: { key: keyof NotificationPreferences; icon: LucideIcon; title: string; sub: string }[] = [
  { key: 'checkin', icon: CalendarClock, title: 'Check-ins', sub: 'Check-ins and reservations' },
  { key: 'family', icon: Users, title: 'Family', sub: 'Members added or removed' },
  { key: 'security', icon: ShieldCheck, title: 'Security', sub: 'Covers sign-in, PIN, password and face changes' },
  { key: 'document', icon: FileText, title: 'Documents', sub: 'Documents verified or rejected' },
];

/** Same shape as the loaded group: tile, two lines, toggle. */
function PrefsSkeleton() {
  return (
    <View style={{ gap: 10 }}>
      <Bone w={110} h={11} style={{ marginLeft: 4 }} />
      <Card pad={0} style={{ paddingHorizontal: 16 }}>
        {ROWS.map((r, i) => (
          <View key={r.key}>
            {i > 0 && <Divider inset={54} />}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 }}>
              <Bone w={40} h={40} r={13} />
              <View style={{ flex: 1, gap: 8 }}>
                <Bone w="40%" />
                <Bone w="70%" h={11} />
              </View>
              <Bone w={50} h={30} r={15} />
            </View>
          </View>
        ))}
      </Card>
    </View>
  );
}

export default function NotificationPreferencesScreen() {
  const toast = useToast();
  const prefs = useNotificationPreferences();
  const update = useUpdateNotificationPreferences();

  const set = (key: keyof NotificationPreferences, on: boolean) =>
    update.mutate({ [key]: on }, { onError: () => toast.show('error', "Couldn't save that. Try again.") });

  return (
    <Screen header={<TopBar title="Notification preferences" />} contentStyle={{ paddingTop: 4 }}>
      <Heading
        title="Choose your"
        accent="alerts."
        sub="Turning one off stops push alerts for it; you'll still see it in your inbox."
      />

      <Async q={prefs} skeleton={<PrefsSkeleton />}>
        {(p) => (
          <View style={{ gap: 14 }}>
            <Group title="Push alerts">
              {ROWS.map((r) => (
                <ListRow
                  key={r.key}
                  icon={r.icon}
                  tone="sky"
                  title={r.title}
                  sub={r.sub}
                  chevron={false}
                  trailing={<Toggle on={p[r.key]} onChange={(v) => set(r.key, v)} label={r.title} />}
                />
              ))}
            </Group>
            <Txt v="small" color={C.ink4} center>
              Push alerts arrive once notifications are enabled on this phone.
            </Txt>
          </View>
        )}
      </Async>
    </Screen>
  );
}
