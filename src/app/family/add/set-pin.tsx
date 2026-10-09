/** @jsxImportSource react */
/**
 * A twin's check-in PIN. Twins look alike, so when a twin's face matches at
 * a venue the kiosk also asks for their own 4-digit PIN.
 *
 *  - Setup (`mode` absent): the last step of adding a twin — processing opens
 *    it over the member page once their document is approved; the member
 *    page's "Set PIN" opens it too if they left before. No PIN gate, like a
 *    member's first face.
 *  - Change (`mode=change`): the account holder's own PIN first (verify-pin,
 *    same lockout as Confirm it's you), then the new twin PIN — PUT sends
 *    that reauthToken.
 *
 * The keypad types into "PIN" until it's full, then into "Confirm"; delete
 * walks back the same way. Pops back to the member page when saved.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { isMockApi } from '@/api';
import { toApiError } from '@/api/errors';
import { MOCK_PIN } from '@/api/mock';
import { useToast } from '@/components/composite/Toast';
import { PIN_LENGTH, usePinVerification } from '@/features/auth/usePinVerification';
import { useSetFamilyMemberPin } from '@/features/family/hooks';
import { formatCountdown } from '@/hooks/useCountdown';
import { Keypad } from '@/premium/blocks';
import { applyPinKey } from '@/premium/flows/account';
import { Banner, CodeInput } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Screen, Steps, TopBar, Txt } from '@/premium/ui';

export default function TwinPinScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const { personId = '', name, mode } = useLocalSearchParams<{ personId?: string; name?: string; mode?: string }>();
  const first = (name ?? '').trim().split(' ')[0] || 'them';
  const isChange = mode === 'change';

  // The holder's token must be scoped to the PIN change; a face_update one gets 403.
  const gate = usePinVerification('check_in_pin_update');
  // Change mode starts on the holder's PIN; setup goes straight to the new one.
  const [holderOk, setHolderOk] = useState(!isChange);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const savePin = useSetFamilyMemberPin(personId);

  const mismatch = confirm.length === PIN_LENGTH && pin !== confirm;

  const verifyHolder = async (value?: string) => {
    if (await gate.submit(value)) setHolderOk(true);
  };

  const save = async (p: string, c: string) => {
    if (!personId || savePin.isPending || p.length !== PIN_LENGTH || p !== c) return;
    setError(null);
    try {
      await savePin.mutateAsync({ pin: p, replace: isChange });
      toast({ variant: 'success', title: isChange ? `${first}'s PIN changed` : `${first}'s PIN is set` });
      router.back();
    } catch (err) {
      setError(toApiError(err).message || "Couldn't save the PIN. Please try again.");
      setPin('');
      setConfirm('');
      // The holder's PIN token is single use — ask for it again.
      if (isChange) {
        gate.setPin('');
        setHolderOk(false);
      }
    }
  };

  const onKey = (k: string) => {
    if (!holderOk) {
      if (gate.locked || gate.isPending) return;
      const v = applyPinKey(gate.pin, k, PIN_LENGTH);
      if (v === gate.pin) return;
      gate.setPin(v);
      if (v.length === PIN_LENGTH) void verifyHolder(v);
      return;
    }
    if (savePin.isPending) return;
    if (k === 'del') {
      if (confirm.length > 0) setConfirm(confirm.slice(0, -1));
      else setPin(pin.slice(0, -1));
      return;
    }
    if (pin.length < PIN_LENGTH) {
      setPin(applyPinKey(pin, k, PIN_LENGTH));
      return;
    }
    if (confirm.length >= PIN_LENGTH) return;
    const v = applyPinKey(confirm, k, PIN_LENGTH);
    setConfirm(v);
    if (v.length === PIN_LENGTH) void save(pin, v);
  };

  const demoPin = __DEV__ && isMockApi() && !holderOk && (
    <Txt v="small" color={C.ink4} center>
      Demo PIN: {MOCK_PIN}
    </Txt>
  );

  if (!holderOk) {
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
              onPress={() => void verifyHolder()}
            />
          </>
        }>
        <Steps total={2} current={0} />
        <Heading title="Enter your" accent="PIN." sub={`Required before changing ${first}'s check-in PIN.`} center />
        <CodeInput
          length={PIN_LENGTH}
          value={gate.pin}
          onChange={gate.setPin}
          onComplete={(v) => void verifyHolder(v)}
          error={gate.error != null}
          disabled={gate.locked}
          dots
          autoFocus={false}
          label="Your PIN"
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
            title={attemptsUsed ? `${gate.attemptsLeft} attempt${gate.attemptsLeft === 1 ? '' : 's'} remaining` : 'Verification failed'}
            body={gate.error}
          />
        ) : error ? (
          <Banner tone="error" body={error} />
        ) : null}
        {demoPin}
      </Screen>
    );
  }

  const onConfirmRow = pin.length === PIN_LENGTH;

  return (
    <Screen
      header={<TopBar title={isChange ? 'Change check-in PIN' : 'Check-in PIN'} />}
      contentStyle={{ paddingTop: 8, gap: 22 }}
      footer={
        <>
          <Keypad onKey={onKey} disabled={savePin.isPending} />
          <Button
            label={isChange ? 'Change PIN' : 'Set PIN'}
            loading={savePin.isPending}
            disabled={pin.length !== PIN_LENGTH || confirm.length !== PIN_LENGTH || mismatch}
            onPress={() => void save(pin, confirm)}
          />
        </>
      }>
      <Steps total={isChange ? 2 : 4} current={isChange ? 1 : 3} />
      <Heading
        title={isChange ? 'New PIN for' : 'Set a PIN for'}
        accent={`${first}.`}
        sub={`Twins look alike, so venues ask for this PIN when ${first} checks in. 4 digits — avoid birthdays and repeated numbers.`}
        center
      />

      <View style={{ gap: 8 }}>
        <Txt v="smallStrong" color={onConfirmRow ? C.ink3 : C.ink2}>
          {`${first}'s PIN`}
        </Txt>
        <CodeInput length={PIN_LENGTH} value={pin} onChange={setPin} dots autoFocus={false} label={`${first}'s PIN`} />
      </View>

      <View style={{ gap: 8 }}>
        <Txt v="smallStrong" color={onConfirmRow ? C.ink2 : C.ink3}>
          Confirm PIN
        </Txt>
        <CodeInput
          length={PIN_LENGTH}
          value={confirm}
          onChange={setConfirm}
          onComplete={(v) => void save(pin, v)}
          error={mismatch}
          dots
          autoFocus={false}
          label="Confirm PIN"
        />
        {mismatch && (
          <Txt v="small" color={C.redInk}>
            PINs don&apos;t match.
          </Txt>
        )}
      </View>

      {error ? <Banner tone="error" body={error} /> : null}
    </Screen>
  );
}
