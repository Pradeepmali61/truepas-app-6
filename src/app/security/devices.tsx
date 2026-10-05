/** @jsxImportSource react */
import { LogOut, Monitor, Smartphone, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useRevokeOtherSessions, useRevokeSession, useSessions } from '@/features/account/hooks';
import { useLogoutFlow } from '@/features/auth/useLogoutFlow';
import { useToast } from '@/hooks/useToast';
import { timeAgo } from '@/premium/flows/account';
import { Async, ConfirmSheet, EmptyView, SkeletonList } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Badge, Button, Group, Heading, ListRow, Screen, TopBar, Txt } from '@/premium/ui';
import type { AuthSession } from '@/types/domain';

const PLATFORM: Record<string, string> = { android: 'Android', ios: 'iOS', web: 'Web' };

function deviceIcon(s: AuthSession): LucideIcon {
  return s.platform === 'web' ? Monitor : Smartphone;
}

function deviceSub(s: AuthSession): string {
  const parts = [
    s.platform ? (PLATFORM[s.platform] ?? s.platform) : null,
    s.appVersion ? `v${s.appVersion}` : null,
    s.current ? 'Active now' : s.lastActiveAt ? `Active ${timeAgo(s.lastActiveAt)}` : null,
  ];
  return parts.filter(Boolean).join(' · ');
}

/**
 * Signed-in devices (backend Oct 2026 §4.3) — GET /auth/sessions, one row
 * per device; `current` marks this phone. Revoking another device signs it
 * out on its next call. Revoking this phone's own session signs out here
 * right away (useLogoutFlow). Sessions from before device labels existed
 * have device: null → "Unknown device".
 */
export default function DevicesScreen() {
  const toast = useToast();
  const sessions = useSessions();
  const revoke = useRevokeSession();
  const revokeOthers = useRevokeOtherSessions();
  const { logout } = useLogoutFlow();
  const [target, setTarget] = useState<AuthSession | null>(null);
  const [confirmOthers, setConfirmOthers] = useState(false);

  const list = [...(sessions.data ?? [])].sort(
    (a, b) => Number(b.current) - Number(a.current) || (b.lastActiveAt ?? '').localeCompare(a.lastActiveAt ?? ''),
  );
  const others = list.filter((s) => !s.current).length;

  const revokeOne = async (s: AuthSession) => {
    try {
      await revoke.mutateAsync(s.id);
      setTarget(null);
      if (s.current) {
        // This phone's own session is gone — finish signing out locally now.
        await logout();
        return;
      }
      toast.show('success', `${s.device ?? 'Device'} signed out`);
    } catch (err) {
      setTarget(null);
      if (s.current) {
        await logout();
        return;
      }
      toast.show('error', toApiError(err).message || "Couldn't sign that device out. Please try again.");
    }
  };

  const revokeAllOthers = async () => {
    try {
      const res = await revokeOthers.mutateAsync();
      setConfirmOthers(false);
      const n = res?.revoked ?? others;
      toast.show('success', n === 1 ? '1 device signed out' : `${n} devices signed out`);
    } catch (err) {
      setConfirmOthers(false);
      toast.show('error', toApiError(err).message || "Couldn't sign out other devices. Please try again.");
    }
  };

  return (
    <Screen
      header={<TopBar title="Signed-in devices" />}
      contentStyle={{ paddingTop: 4 }}
      refreshing={sessions.isRefetching}
      onRefresh={() => void sessions.refetch()}
      footer={
        others > 0 ? (
          <Button label="Sign out all other devices" tone="white" icon={LogOut} onPress={() => setConfirmOthers(true)} />
        ) : undefined
      }>
      <Heading title="Your" accent="devices." sub="Where your account is signed in. Sign out any device you don't recognise." />

      <Async
        q={sessions}
        skeleton={<SkeletonList rows={3} thumb={40} />}
        empty={(d) => d.length === 0}
        emptyView={<EmptyView icon={Smartphone} title="No devices" body="No signed-in devices were found." />}>
        {() => (
          <Group>
            {list.map((s) => (
              <ListRow
                key={s.id}
                icon={deviceIcon(s)}
                tone={s.current ? 'sky' : 'neutral'}
                title={s.device || 'Unknown device'}
                sub={deviceSub(s)}
                chevron={false}
                onPress={() => setTarget(s)}
                trailing={
                  s.current ? (
                    <Badge label="This phone" tone="green" dot />
                  ) : (
                    <Txt v="smallStrong" color={C.redInk}>
                      Sign out
                    </Txt>
                  )
                }
              />
            ))}
          </Group>
        )}
      </Async>

      {others > 0 && (
        <View style={{ paddingHorizontal: 4 }}>
          <Txt v="small" color={C.ink4}>
            A signed-out device has to sign in again with your password.
          </Txt>
        </View>
      )}

      <ConfirmSheet
        visible={target != null}
        danger
        icon={LogOut}
        title={target?.current ? 'Sign out of this phone?' : `Sign out ${target?.device || 'this device'}?`}
        body={
          target?.current
            ? "You'll need your password to sign in again."
            : "It's signed out straight away and needs your password to sign in again."
        }
        confirmLabel="Sign out"
        loading={revoke.isPending}
        onCancel={() => setTarget(null)}
        onConfirm={() => target && void revokeOne(target)}
      />

      <ConfirmSheet
        visible={confirmOthers}
        danger
        icon={LogOut}
        title="Sign out all other devices?"
        body={`${others === 1 ? '1 other device' : `${others} other devices`} will be signed out. This phone stays signed in.`}
        confirmLabel="Sign out others"
        loading={revokeOthers.isPending}
        onCancel={() => setConfirmOthers(false)}
        onConfirm={() => void revokeAllOthers()}
      />
    </Screen>
  );
}
