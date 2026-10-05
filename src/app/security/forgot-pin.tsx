/** @jsxImportSource react */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { KeyRound, Mail, MailCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { toApiError } from '@/api/errors';
import { useForgotPassword, useResetPin } from '@/features/auth/mutations';
import { PIN_LENGTH } from '@/features/auth/usePinVerification';
import { useToast } from '@/hooks/useToast';
import { Keypad } from '@/premium/blocks';
import { OtpScreen } from '@/premium/flows/auth';
import { applyPinKey } from '@/premium/flows/account';
import { Banner, CodeInput } from '@/premium/kit';
import { C, F } from '@/premium/theme';
import { back, Button, Card, Heading, Screen, Steps, Tile, TopBar, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';

type Step = 'send' | 'otp' | 'pin';

/**
 * Forgot PIN — backend Oct 2026 §4.6, the reset-PIN flow (not a password
 * reset, and no sign-out):
 *  1. POST /auth/forgot-password { email }            → code emailed
 *  2. POST /auth/verify-otp { email, otp, purpose: 'password_reset' }
 *  3. POST /auth/reset-pin { email, otp, newPin }
 * The email is the signed-in user's. With `?next=` (from the confirm-pin
 * gate) the gate opens again afterwards so the new PIN continues that flow;
 * otherwise it goes back to the screen that asked for the PIN.
 */
export default function ForgotPinScreen() {
  const router = useRouter();
  const toast = useToast();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const email = useAppSelector((state) => state.auth.user?.email ?? '');
  const [step, setStep] = useState<Step>('send');
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [codeExpired, setCodeExpired] = useState(false);
  const forgot = useForgotPassword();
  const resetPin = useResetPin();

  const sendCode = async () => {
    if (!email || forgot.isPending) return;
    try {
      await forgot.mutateAsync({ email });
      setCodeExpired(false);
      setStep('otp');
    } catch (err) {
      toast.show('error', toApiError(err).message || "Couldn't send the code. Please try again.");
    }
  };

  const finish = () => {
    if (next) {
      router.replace({ pathname: '/security/confirm-pin', params: { next } } as never);
    } else {
      back();
    }
  };

  const submit = async (pin: string, confirm: string) => {
    if (pin.length !== PIN_LENGTH || pin !== confirm || resetPin.isPending) return;
    try {
      await resetPin.mutateAsync({ email, otp, newPin: pin });
      toast.show('success', 'PIN reset. Use your new PIN from now on.');
      finish();
    } catch (err) {
      const apiErr = toApiError(err);
      setNewPin('');
      setConfirmPin('');
      if (apiErr.status === 400 || apiErr.status === 401 || apiErr.status === 410) {
        // The emailed code is no longer valid — start over with a fresh one.
        setOtp('');
        setCodeExpired(true);
        setStep('send');
        return;
      }
      toast.show('error', apiErr.message || "Couldn't reset your PIN. Please try again.");
    }
  };

  const mismatch = confirmPin.length === PIN_LENGTH && newPin !== confirmPin;

  const onKey = (k: string) => {
    if (resetPin.isPending) return;
    if (k === 'del') {
      if (confirmPin.length > 0) setConfirmPin(confirmPin.slice(0, -1));
      else setNewPin(newPin.slice(0, -1));
      return;
    }
    if (newPin.length < PIN_LENGTH) {
      setNewPin(applyPinKey(newPin, k, PIN_LENGTH));
      return;
    }
    if (confirmPin.length >= PIN_LENGTH) return;
    const v = applyPinKey(confirmPin, k, PIN_LENGTH);
    setConfirmPin(v);
    if (v.length === PIN_LENGTH) void submit(newPin, v);
  };

  if (!email) return <Redirect href="/security" />;

  if (step === 'otp') {
    return (
      <OtpScreen
        topTitle="Reset PIN"
        icon={MailCheck}
        title="Check your"
        accent="inbox."
        sub="Enter the 6-digit code we emailed you."
        address={email}
        tip="Can't find it? Check your spam or promotions folder."
        purpose="password_reset"
        identifier={{ email }}
        onBack={() => setStep('send')}
        onResend={async () => {
          await forgot.mutateAsync({ email });
        }}
        onVerified={(_response, code) => {
          setOtp(code);
          setStep('pin');
        }}
      />
    );
  }

  if (step === 'send') {
    return (
      <Screen
        header={<TopBar title="Reset PIN" />}
        contentStyle={{ paddingTop: 8 }}
        footer={<Button label="Email me a code" icon={Mail} loading={forgot.isPending} onPress={() => void sendCode()} />}>
        <Tile icon={KeyRound} tone="sky" size={60} />
        <Heading title="Forgot your" accent="PIN?" sub="We'll email you a code. Enter it, then choose a new PIN. You stay signed in." />
        <Card style={{ gap: 4, alignItems: 'center' }}>
          <Txt v="small">Code goes to</Txt>
          <Text
            style={{ fontFamily: F.semibold, fontSize: 15, color: C.ink }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}>
            {email}
          </Text>
        </Card>
        {codeExpired && (
          <Banner tone="warning" title="Code expired" body="That code can't be used any more. Send a new one to try again." />
        )}
      </Screen>
    );
  }

  return (
    <Screen
      header={<TopBar title="Reset PIN" onBack={() => setStep('send')} />}
      contentStyle={{ paddingTop: 8, gap: 22 }}
      footer={
        <>
          <Keypad onKey={onKey} disabled={resetPin.isPending} />
          <Button
            label="Save new PIN"
            loading={resetPin.isPending}
            disabled={newPin.length !== PIN_LENGTH || confirmPin.length !== PIN_LENGTH || mismatch}
            onPress={() => void submit(newPin, confirmPin)}
          />
        </>
      }>
      <Steps total={2} current={1} />
      <Heading title="Choose a new" accent="PIN." sub="4 digits. Avoid birthdays and repeated numbers." center />

      <View style={{ gap: 8 }}>
        <Txt v="smallStrong" color={newPin.length === PIN_LENGTH ? C.ink3 : C.ink2}>
          New PIN
        </Txt>
        <CodeInput length={PIN_LENGTH} value={newPin} onChange={setNewPin} dots autoFocus={false} label="New PIN" />
      </View>

      <View style={{ gap: 8 }}>
        <Txt v="smallStrong" color={newPin.length === PIN_LENGTH ? C.ink2 : C.ink3}>
          Confirm new PIN
        </Txt>
        <CodeInput
          length={PIN_LENGTH}
          value={confirmPin}
          onChange={setConfirmPin}
          onComplete={(v) => void submit(newPin, v)}
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
    </Screen>
  );
}
