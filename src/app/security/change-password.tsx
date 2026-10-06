/** @jsxImportSource react */
import { Check, Eye, EyeOff, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useChangePassword } from '@/features/auth/mutations';
import { newPasswordSchema } from '@/features/auth/schemas';
import { useLogoutFlow } from '@/features/auth/useLogoutFlow';
import { useToast } from '@/hooks/useToast';
import { Banner } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Card, Field, Heading, Row, Screen, TopBar, Txt } from '@/premium/ui';

/** Live checklist — mirrors newPasswordSchema (the schema stays the source of truth for errors). */
const RULES: { t: string; test: (v: string) => boolean }[] = [
  { t: 'At least 8 characters', test: (v) => v.length >= 8 },
  { t: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { t: 'One lowercase letter', test: (v) => /[a-z]/.test(v) },
  { t: 'One number', test: (v) => /[0-9]/.test(v) },
  { t: 'One symbol', test: (v) => /[^A-Za-z0-9]/.test(v) },
];

/**
 * Change password — POST /auth/change-password { currentPassword, newPassword }.
 * Success revokes refresh sessions and the current access token, so the user
 * is signed out through the shared logout (same local wipe as every other
 * sign-out, incl. the on-device profile photo) and returned to login.
 * Keeps the stricter newPasswordSchema as the field-level error.
 */
export default function ChangePasswordScreen() {
  const { logout } = useLogoutFlow();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const changePassword = useChangePassword();
  const toast = useToast();

  const passwordCheck = newPasswordSchema.safeParse(newPassword);
  // BUG008 — product rule: the new password must differ from the current one.
  const sameAsCurrent = newPassword.length > 0 && newPassword === currentPassword;
  const nextError = sameAsCurrent
    ? 'New password must be different from your current password.'
    : newPassword.length > 0 && !passwordCheck.success
      ? passwordCheck.error.issues[0].message
      : undefined;
  const confirmError =
    confirmPassword.length > 0 && confirmPassword !== newPassword
      ? "Passwords don't match."
      : undefined;
  const canSubmit =
    currentPassword.length > 0 &&
    passwordCheck.success &&
    !sameAsCurrent &&
    confirmPassword === newPassword;

  const handleChange = async () => {
    if (!canSubmit || changePassword.isPending) return;
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
    } catch (err: unknown) {
      toast.show('error', toApiError(err).message || 'Could not update password. Please try again.');
      return;
    }
    // Contract: success revokes refresh sessions and the current access
    // token. Sign out through the shared logout so the next account on this
    // phone can't inherit local state (profile photo, query cache, tokens,
    // session stashes); serverRevoked skips the now-pointless /auth/logout.
    await logout({ serverRevoked: true });
    toast.show('success', 'Password updated — sign in again.');
  };

  const passed = RULES.filter((r) => r.test(newPassword)).length;
  const strength =
    newPassword.length === 0
      ? { label: '—', color: C.ink4 }
      : passwordCheck.success
        ? { label: 'Strong', color: C.green }
        : passed >= 3
          ? { label: 'Almost there', color: C.amber }
          : { label: 'Weak', color: C.red };

  const secureInput = { autoCapitalize: 'none', autoCorrect: false } as const;

  return (
    <Screen
      keyboard
      header={<TopBar title="Change password" />}
      contentStyle={{ paddingTop: 8 }}
      footer={
        <Button
          label="Update password"
          loading={changePassword.isPending}
          disabled={!canSubmit}
          onPress={() => void handleChange()}
        />
      }>
      <Heading title="A new" accent="password." sub="Choose something you don't use anywhere else." />

      <View style={{ gap: 18 }}>
        <Field
          label="Current password"
          icon={Lock}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Current password"
          secure
          inputProps={{ ...secureInput, autoComplete: 'current-password', textContentType: 'password' }}
        />
        <Field
          label="New password"
          icon={Lock}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New password"
          secure={!reveal}
          error={nextError}
          hint={nextError == null ? '8+ characters with uppercase, lowercase, number & symbol.' : undefined}
          inputProps={{ ...secureInput, autoComplete: 'new-password', textContentType: 'newPassword' }}
          right={
            <Pressable
              onPress={() => setReveal((v) => !v)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={reveal ? 'Hide passwords' : 'Show passwords'}>
              {reveal ? <EyeOff size={19} color={C.ink3} /> : <Eye size={19} color={C.ink3} />}
            </Pressable>
          }
        />
        <Field
          label="Confirm new password"
          icon={Lock}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat password"
          secure={!reveal}
          error={confirmError}
          inputProps={{ ...secureInput, autoComplete: 'new-password', textContentType: 'newPassword' }}
        />
      </View>

      <Card style={{ gap: 12 }}>
        <Row between>
          <Txt v="smallStrong">Strength</Txt>
          <Txt v="smallStrong" color={strength.color}>
            {strength.label}
          </Txt>
        </Row>
        <Row gap={6}>
          {RULES.map((r, i) => (
            <View
              key={r.t}
              style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: i < passed ? strength.color : C.line }}
            />
          ))}
        </Row>
        {RULES.map((r) => {
          const ok = r.test(newPassword);
          return (
            <Row key={r.t} gap={10}>
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: ok ? C.greenWash : C.sunken,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {ok && <Check size={12} color={C.greenInk} strokeWidth={3} />}
              </View>
              <Txt v="body" color={ok ? C.ink : C.ink3}>
                {r.t}
              </Txt>
            </Row>
          );
        })}
      </Card>

      <Banner
        tone="warning"
        title="You'll be signed out"
        body="All sessions end when the password changes. Sign in again afterwards."
      />
    </Screen>
  );
}
