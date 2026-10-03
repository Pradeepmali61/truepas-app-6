/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { isMockApi } from '@/api';
import { toApiError } from '@/api/errors';
import { MOCK_PIN } from '@/api/mock';
import { useChangePin } from '@/features/auth/mutations';
import { useToast } from '@/hooks/useToast';
import { Keypad } from '@/premium/blocks';
import { applyPinKey } from '@/premium/flows/account';
import { CodeInput } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Screen, Steps, TopBar, Txt } from '@/premium/ui';
import { pinStore } from '@/services/pinStore';

const PIN_LENGTH = 4;

/**
 * Change PIN — create step. The current PIN is verified by the confirm-pin
 * gate (step 1) and stashed in pinStore; this screen only asks for the new
 * PIN + confirmation on one screen, then calls POST /auth/change-pin
 * { currentPin, newPin }.
 *
 * The keypad types into "New PIN" until it's full, then into "Confirm";
 * delete walks back the same way. Each cell row also accepts direct typing.
 */
export default function ChangePinScreen() {
  const router = useRouter();
  const currentPin = pinStore.get();
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const changePin = useChangePin();
  const toast = useToast();

  useEffect(() => {
    if (!currentPin) {
      // Direct entry without the PIN gate — send the user back to security.
      router.replace('/security' as never);
    }
    // Release the stashed PIN when leaving — success clears it too, this
    // covers back-out so a stale PIN can't be replayed later.
    return () => pinStore.clear();
  }, [currentPin, router]);

  const mismatch = confirmPin.length === PIN_LENGTH && newPin !== confirmPin;
  // BUG009 — product rule: the new PIN must differ from the current one.
  const sameAsCurrent = newPin.length === PIN_LENGTH && newPin === currentPin;

  const handleUpdate = async (pin: string, confirm: string) => {
    if (
      !currentPin ||
      changePin.isPending ||
      pin.length !== PIN_LENGTH ||
      pin !== confirm ||
      pin === currentPin
    ) {
      return;
    }
    try {
      await changePin.mutateAsync({ currentPin, newPin: pin });
      pinStore.clear();
      toast.show('success', 'PIN updated');
      router.back();
    } catch (err: any) {
      toast.show('error', toApiError(err).message || 'Could not update PIN. Please try again.');
      // Likely a mistyped current PIN — restart the gate.
      setNewPin('');
      setConfirmPin('');
    }
  };

  const onKey = (k: string) => {
    if (changePin.isPending) return;
    if (k === 'del') {
      if (confirmPin.length > 0) setConfirmPin(confirmPin.slice(0, -1));
      else setNewPin(newPin.slice(0, -1));
      return;
    }
    if (newPin.length < PIN_LENGTH) {
      setNewPin(applyPinKey(newPin, k, PIN_LENGTH));
      return;
    }
    // A new PIN equal to the current one must be fixed before confirming.
    if (sameAsCurrent || confirmPin.length >= PIN_LENGTH) return;
    const v = applyPinKey(confirmPin, k, PIN_LENGTH);
    setConfirmPin(v);
    if (v.length === PIN_LENGTH) void handleUpdate(newPin, v);
  };

  if (!currentPin) {
    return null;
  }

  const onConfirmRow = newPin.length === PIN_LENGTH && !sameAsCurrent;

  return (
    <Screen
      header={<TopBar title="Change PIN" />}
      contentStyle={{ paddingTop: 8, gap: 22 }}
      footer={
        <>
          <Keypad onKey={onKey} disabled={changePin.isPending} />
          <Button
            label="Update PIN"
            loading={changePin.isPending}
            disabled={
              newPin.length !== PIN_LENGTH ||
              confirmPin.length !== PIN_LENGTH ||
              mismatch ||
              sameAsCurrent
            }
            onPress={() => void handleUpdate(newPin, confirmPin)}
          />
        </>
      }>
      <Steps total={2} current={1} />
      <Heading title="Choose a new" accent="PIN." sub="4 digits. Avoid birthdays and repeated numbers." center />

      <View style={{ gap: 8 }}>
        <Txt v="smallStrong" color={onConfirmRow ? C.ink3 : C.ink2}>
          New PIN
        </Txt>
        <CodeInput
          length={PIN_LENGTH}
          value={newPin}
          onChange={setNewPin}
          error={sameAsCurrent}
          dots
          autoFocus={false}
          label="New PIN"
        />
        {sameAsCurrent && (
          <Txt v="small" color={C.redInk}>
            New PIN must be different from your current PIN.
          </Txt>
        )}
      </View>

      <View style={{ gap: 8 }}>
        <Txt v="smallStrong" color={onConfirmRow ? C.ink2 : C.ink3}>
          Confirm new PIN
        </Txt>
        <CodeInput
          length={PIN_LENGTH}
          value={confirmPin}
          onChange={setConfirmPin}
          onComplete={(v) => void handleUpdate(newPin, v)}
          error={mismatch}
          dots
          autoFocus={false}
          label="Confirm new PIN"
        />
        {mismatch && (
          <Txt v="small" color={C.redInk}>
            PINs don&apos;t match.
          </Txt>
        )}
      </View>

      {__DEV__ && isMockApi() && (
        <Txt v="small" color={C.ink4} center>
          Demo PIN: {MOCK_PIN}
        </Txt>
      )}
    </Screen>
  );
}
