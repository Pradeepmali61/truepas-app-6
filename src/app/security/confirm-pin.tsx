/** @jsxImportSource react */
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { isMockApi } from '@/api';
import { MOCK_PIN } from '@/api/mock';
import { sessionEnded } from '@/features/auth/slice';
import { PIN_LENGTH, usePinVerification } from '@/features/auth/usePinVerification';
import { formatCountdown } from '@/hooks/useCountdown';
import { Keypad } from '@/premium/blocks';
import { applyPinKey } from '@/premium/flows/account';
import { Banner, CodeInput, ConfirmSheet } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Screen, Steps, TextLink, TopBar, Txt } from '@/premium/ui';
import { pinStore } from '@/services/pinStore';
import { useAppDispatch } from '@/store';

/**
 * Re-auth PIN gate shown before sensitive actions (change password / change
 * PIN). Verifies the CURRENT PIN via POST /auth/verify-pin, then replaces to
 * the `next` route passed as a query param. The verified PIN is stashed in
 * pinStore (not a route param — params can leak into logs) for change-pin's
 * currentPin. The attempt lockout and Forgot-PIN escape hatch are real
 * backend contract features.
 */
export default function ConfirmPinScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const gate = usePinVerification();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [confirmForgot, setConfirmForgot] = useState(false);

  // PIN can't be recovered in-app — the only way back is an email password
  // reset, which ends this session first.
  const signOutAndReset = () => {
    setConfirmForgot(false);
    pinStore.clear();
    queryClient.clear();
    dispatch(sessionEnded());
    router.replace('/(auth)/forgot-password' as never);
  };

  const submit = async (value?: string) => {
    const code = await gate.submit(value);
    if (!code) return;
    pinStore.set(code);
    router.replace(next ? ({ pathname: next } as never) : ('/' as never));
  };

  const onKey = (k: string) => {
    if (gate.locked || gate.isPending) return;
    const v = applyPinKey(gate.pin, k, PIN_LENGTH);
    if (v === gate.pin) return;
    gate.setPin(v);
    if (v.length === PIN_LENGTH) void submit(v);
  };

  const attemptsUsed = gate.attemptsLeft < gate.maxAttempts;

  return (
    <Screen
      header={<TopBar title="Confirm it's you" />}
      contentStyle={{ paddingTop: 8, gap: 22 }}
      footer={
        <>
          <Keypad onKey={onKey} disabled={gate.locked || gate.isPending} />
          <Button
            label="Verify"
            loading={gate.isPending}
            disabled={gate.pin.length !== PIN_LENGTH || gate.locked}
            onPress={() => void submit()}
          />
        </>
      }>
      {next === '/security/change-pin' && <Steps total={2} current={0} />}
      <Heading
        title="Enter your current"
        accent="PIN."
        sub="Required before changing security settings."
        center
      />

      <CodeInput
        length={PIN_LENGTH}
        value={gate.pin}
        onChange={gate.setPin}
        onComplete={(v) => void submit(v)}
        error={gate.error != null}
        disabled={gate.locked}
        dots
        autoFocus={false}
        label="Account PIN"
      />

      {gate.locked ? (
        <Banner
          tone="error"
          title="PIN locked"
          body={`Too many incorrect attempts. Try again in ${formatCountdown(gate.lockSecondsLeft)}.`}
        />
      ) : gate.error ? (
        <Banner
          tone="error"
          title={
            attemptsUsed
              ? `${gate.attemptsLeft} attempt${gate.attemptsLeft === 1 ? '' : 's'} remaining`
              : 'Verification failed'
          }
          body={`${gate.error}${attemptsUsed ? ' PIN entry locks for 15 minutes after 5 wrong tries.' : ''}`}
        />
      ) : null}

      <View style={{ alignItems: 'center' }}>
        <TextLink label="Forgot PIN?" onPress={() => setConfirmForgot(true)} />
      </View>

      {__DEV__ && isMockApi() && (
        <Txt v="small" color={C.ink4} center>
          Demo PIN: {MOCK_PIN}
        </Txt>
      )}

      <ConfirmSheet
        visible={confirmForgot}
        danger
        icon={LogOut}
        title="Forgot PIN?"
        body="You'll be signed out. Reset your password via email to sign back in."
        confirmLabel="Sign out & reset"
        onCancel={() => setConfirmForgot(false)}
        onConfirm={signOutAndReset}
      />
    </Screen>
  );
}
