/** @jsxImportSource react */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { isMockApi } from '@/api';
import { MOCK_PIN } from '@/api/mock';
import { PIN_LENGTH, usePinVerification } from '@/features/auth/usePinVerification';
import { formatCountdown } from '@/hooks/useCountdown';
import { Keypad } from '@/premium/blocks';
import { applyPinKey } from '@/premium/flows/account';
import { Banner, CodeInput } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Screen, Steps, TextLink, TopBar, Txt } from '@/premium/ui';
import { pinStore } from '@/services/pinStore';

/**
 * Re-auth PIN gate shown before sensitive actions (change password / change
 * PIN). Verifies the CURRENT PIN via POST /auth/verify-pin, then replaces to
 * the `next` route passed as a query param. The verified PIN is stashed in
 * pinStore (not a route param — params can leak into logs) for change-pin's
 * currentPin. The attempt lockout is the real backend contract; "Forgot
 * PIN?" runs the email reset-PIN flow (/security/forgot-pin, §4.6) without
 * signing out, then reopens this gate for the same `next`.
 */
export default function ConfirmPinScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const gate = usePinVerification();

  // Replace (not push) so a locked gate isn't left underneath — forgot-pin
  // opens a fresh gate when it's done.
  const forgotPin = () => {
    pinStore.clear();
    router.replace({ pathname: '/security/forgot-pin', params: next ? { next } : {} } as never);
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
        <TextLink label="Forgot PIN?" onPress={forgotPin} />
      </View>

      {__DEV__ && isMockApi() && (
        <Txt v="small" color={C.ink4} center>
          Demo PIN: {MOCK_PIN}
        </Txt>
      )}
    </Screen>
  );
}
