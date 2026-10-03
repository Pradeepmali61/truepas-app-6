/** @jsxImportSource react */
/**
 * Profile — account card (photo, name, face status, email, phone) plus the
 * account menu: edit profile, security & sign-in, settings (appearance),
 * sign out (confirm sheet → useLogoutFlow: server revoke + full local
 * teardown) and delete account.
 *
 * Stats are real counts from the existing family / documents / bookings
 * queries. The mockup's TP ID badge and QR pass button have no backend and
 * are dropped.
 */
import {
  Bell,
  CircleHelp,
  FileText,
  Info,
  LogOut,
  Mail,
  Phone,
  Settings,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { useLogoutFlow } from '@/features/auth/useLogoutFlow';
import { useDocuments } from '@/features/documents/hooks';
import { useFamily } from '@/features/family/hooks';
import { useBookings } from '@/features/history/hooks';
import { useProfilePicture } from '@/features/profile/hooks';
import { APP_VERSION } from '@/premium/flows/account';
import { ConfirmSheet, LoadingView } from '@/premium/kit';
import { C, F } from '@/premium/theme';
import { Avatar, Badge, Button, Card, go, Group, ListRow, Row, Screen, TopBar, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';
import type { User } from '@/types/domain';

export default function ProfileScreen() {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) {
    return (
      <Screen header={<TopBar title="Profile" />} scroll={false}>
        <LoadingView full />
      </Screen>
    );
  }

  // Count queries live in the child so they unmount with the session —
  // after sign-out (user → null) they must not refetch without a token.
  return <ProfileContent user={user} />;
}

function ProfileContent({ user }: { user: User }) {
  const { url: profilePictureUrl } = useProfilePicture();
  const { logout, isPending: signingOut } = useLogoutFlow();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const family = useFamily();
  const documents = useDocuments();
  const bookings = useBookings();

  const familyCount = family.data?.length;
  const stats = [
    { k: 'Check-ins', v: bookings.data?.filter((b) => b.status === 'completed').length },
    { k: 'Family', v: familyCount },
    { k: 'Documents', v: documents.data?.length },
  ];

  return (
    <Screen header={<TopBar title="Profile" />} contentStyle={{ paddingTop: 4 }}>
      {/* ---------- account card ---------- */}
      <View style={{ alignItems: 'center', gap: 12 }}>
        <Avatar
          uri={profilePictureUrl}
          name={user.fullName}
          size={108}
          ring
          status={user.faceEnrolled ? 'verified' : 'pending'}
        />
        <View style={{ alignItems: 'center', gap: 6, alignSelf: 'stretch' }}>
          <Text
            numberOfLines={1}
            style={{ fontFamily: F.extrabold, fontSize: 28, letterSpacing: -0.8, color: C.ink, textAlign: 'center' }}>
            {user.fullName}
          </Text>
          <Row gap={6}>
            <Mail size={14} color={C.ink3} />
            <Txt v="small" lines={1}>
              {user.email}
            </Txt>
          </Row>
          <Row gap={6}>
            <Phone size={14} color={C.ink3} />
            <Txt v="small" lines={1}>
              {user.phone}
            </Txt>
          </Row>
        </View>
        <Row>
          {user.faceEnrolled ? (
            <Badge label="Face verified" tone="green" icon={ShieldCheck} />
          ) : (
            <Badge label="Face not set up" tone="amber" dot />
          )}
        </Row>
        <Button label="Edit profile" tone="white" size="sm" full={false} onPress={go('/profile/edit')} />
      </View>

      <Card pad={18} style={{ flexDirection: 'row' }}>
        {stats.map((s, i) => (
          <View
            key={s.k}
            style={{ flex: 1, alignItems: 'center', gap: 2, borderLeftWidth: i ? 1 : 0, borderLeftColor: C.lineSoft }}>
            <Text style={{ fontFamily: F.extrabold, fontSize: 24, letterSpacing: -0.6, color: C.ink }}>
              {s.v ?? '–'}
            </Text>
            <Txt v="small">{s.k}</Txt>
          </View>
        ))}
      </Card>

      {/* ---------- menu ---------- */}
      <Group title="Account">
        <ListRow
          icon={Users}
          tone="sky"
          title="Family"
          sub={familyCount != null ? `${familyCount} member${familyCount === 1 ? '' : 's'}` : undefined}
          onPress={go('/family')}
        />
        <ListRow icon={ShieldCheck} tone="sky" title="Security & sign-in" sub="Face, PIN & password" onPress={go('/security')} />
        <ListRow icon={Bell} tone="sky" title="Notifications" onPress={go('/notification')} />
        <ListRow icon={Settings} tone="sky" title="Settings" sub="Appearance & privacy" onPress={go('/settings')} />
      </Group>
      <Group title="Support">
        <ListRow icon={CircleHelp} title="Help centre" onPress={go('/help')} />
        <ListRow icon={FileText} title="Privacy & data" onPress={go('/legal/data-privacy')} />
        <ListRow icon={Info} title="About Truepas" value={`v${APP_VERSION}`} onPress={go('/about')} />
      </Group>
      <Group>
        <ListRow
          icon={LogOut}
          danger
          title="Sign out"
          chevron={false}
          trailing={signingOut ? <ActivityIndicator size="small" color={C.redInk} /> : undefined}
          onPress={signingOut ? undefined : () => setConfirmSignOut(true)}
        />
        <ListRow icon={Trash2} danger title="Delete account" sub="Erase your data permanently" onPress={go('/account/delete')} />
      </Group>

      <ConfirmSheet
        visible={confirmSignOut}
        icon={LogOut}
        danger
        title="Sign out of Truepas?"
        confirmLabel="Sign out"
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          // Close first — logout navigates away and a still-open Modal
          // would float over the login screen.
          setConfirmSignOut(false);
          void logout();
        }}
      />
    </Screen>
  );
}
