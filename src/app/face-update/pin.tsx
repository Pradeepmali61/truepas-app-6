/** @jsxImportSource react */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View } from 'react-native';

import { isMockApi } from '@/api';
import { MOCK_PIN } from '@/api/mock';
import { PIN_LENGTH, usePinVerification } from '@/features/auth/usePinVerification';
import { formatCountdown } from '@/hooks/useCountdown';
import { Keypad } from '@/premium/blocks';
import { Banner, CodeInput } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Screen, TopBar, Txt } from '@/premium/ui';
import { flowGuards } from '@/services/flowGuards';

/** Update face — PIN verification (PRD FR-04: PIN required for face updates).
 *  Forwards `personId` (when present) so the face update targets the family
 *  member instead of the authenticated main user. Shares attempts/lockout
 *  logic with confirm-pin via usePinVerification. */
export default function FaceUpdatePinScreen() {
  const router = useRouter();
  const { personId, age } = useLocalSearchParams<{ personId?: string; age?: string }>();
  const gate = usePinVerification();
  const busy = gate.locked || gate.isPending;

  const handleComplete = async (value?: string) => {
    const code = await gate.submit(value);
    if (!code) return;
    flowGuards.grant('face-update:camera');
    router.push({
      pathname: '/face-update/camera',
      params: personId ? { personId, ...(age ? { age } : {}) } : {},
    });
  };

  // On-screen keypad drives the same PIN state as the (hidden) code input,
  // which still accepts the system keyboard / paste / screen readers.
  const onKey = (k: string) => {
    if (busy) return;
    if (k === 'del') {
      gate.setPin(gate.pin.slice(0, -1));
      return;
    }
    if (gate.pin.length >= PIN_LENGTH) return;
    const next = gate.pin + k;
    gate.setPin(next);
    if (next.length === PIN_LENGTH) void handleComplete(next);
  };

  return (
    <Screen
      keyboard
      header={<TopBar title="Update face" />}
      contentStyle={{ flexGrow: 1, gap: 22, paddingHorizontal: 24 }}
      footer={
        <Button
          label="Verify"
          loading={gate.isPending}
          disabled={gate.pin.length !== PIN_LENGTH || gate.locked}
          onPress={() => void handleComplete()}
        />
      }>
      <Heading
        title="Enter your"
        accent="PIN."
        center
        sub={
          personId
            ? "For your security, confirm it's you before updating their face."
            : "For your security, confirm it's you before updating your face."
        }
      />

      <CodeInput
        length={PIN_LENGTH}
        value={gate.pin}
        onChange={gate.setPin}
        onComplete={(v) => void handleComplete(v)}
        error={gate.error != null}
        disabled={gate.locked}
        dots
        autoFocus={false}
        label="Current PIN"
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
            gate.attemptsLeft < gate.maxAttempts
              ? `${gate.attemptsLeft} attempt${gate.attemptsLeft === 1 ? '' : 's'} remaining`
              : 'Verification failed'
          }
          body={gate.error}
        />
      ) : null}

      {__DEV__ && isMockApi() && (
        <Txt v="small" color={C.ink4} center>
          Demo PIN: {MOCK_PIN}
        </Txt>
      )}

      <View style={{ flex: 1 }} />
      <Keypad onKey={onKey} disabled={busy} />
    </Screen>
  );
}
