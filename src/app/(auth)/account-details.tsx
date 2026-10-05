/** @jsxImportSource react */
import { zodResolver } from '@hookform/resolvers/zod';
import { Redirect, useRouter } from 'expo-router';
import { ArrowRight, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { clearRegistrationToken, getRegistrationToken } from '@/api/client';
import { toApiError } from '@/api/errors';
import { useToast } from '@/components/composite/Toast';
import { useCompleteAccountDetails } from '@/features/auth/mutations';
import { AccountDetailsForm, accountDetailsSchema } from '@/features/auth/schemas';
import { AuthScreen, DateField, FlowBar, PasswordField, PinField, SIGNUP_STEPS } from '@/premium/flows/auth';
import { Banner } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Field, Heading, Steps, TextLink, Txt } from '@/premium/ui';
import { accountDetailsStore } from '@/services/accountDetailsStore';
import type { AccountDetailsRequest } from '@/types/domain';
import { ADULT_AGE } from '@/utils/age';

/** The date field speaks ISO ("YYYY-MM-DD"); the backend contract takes "MM/DD/YYYY". */
const isoToApiDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return `${m}/${d}/${y}`;
};
const apiDateToIso = (v: string) => {
  const [m, d, y] = v.split('/');
  return m && d && y ? `${y}-${m}-${d}` : undefined;
};

/** Latest DOB that is ADULT_AGE today, as local ISO — the picker's upper bound. */
const latestAdultDob = () => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - ADULT_AGE);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const samePayload = (a: AccountDetailsRequest, b: AccountDetailsRequest) =>
  (Object.keys(a) as (keyof AccountDetailsRequest)[]).every((k) => a[k] === b[k]);

/** Register — account details + PIN + email + password (contract v1.1.0).
 *  After submission, navigates to verify-email (NOT sessionStarted).
 *  409 ACCOUNT_EXISTS (email taken) → field error + "sign in instead". */
export default function AccountDetailsScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmPin, setConfirmPin] = useState('');
  const [confirmPinError, setConfirmPinError] = useState<string | undefined>();
  const [accountExists, setAccountExists] = useState(false);
  const completeAccount = useCompleteAccountDetails();
  // This step submits with the in-memory registration token issued by phone
  // OTP verification — a deep link without it can only dead-end, so bounce
  // back to register.
  const [hasRegistrationToken] = useState(() => getRegistrationToken() !== null);

  const { control, handleSubmit, setError } = useForm<AccountDetailsForm>({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: { fullName: '', dateOfBirth: '', pin: '', email: '', password: '', confirmPassword: '' },
  });
  const pin = useWatch({ control, name: 'pin' });

  const onSubmit = handleSubmit(async (values) => {
    if (confirmPin !== values.pin) {
      setConfirmPinError("PINs don't match");
      return;
    }
    const payload: AccountDetailsRequest = {
      fullName: values.fullName,
      dateOfBirth: values.dateOfBirth,
      pin: values.pin,
      email: values.email,
      password: values.password,
      confirmPassword: values.confirmPassword,
    };
    console.log('[AccountDetails] Submitting:', {
      fullName: payload.fullName,
      email: payload.email,
      dateOfBirth: payload.dateOfBirth,
    });
    // Back-nav resubmit with nothing changed: details are already saved and
    // re-POSTing only burns the email-OTP resend limit (429). Go straight to
    // verify-email instead.
    const stashed = accountDetailsStore.get();
    if (stashed && samePayload(stashed, payload)) {
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: payload.email },
      });
      return;
    }
    try {
      const response = await completeAccount.mutateAsync(payload);
      console.log('[AccountDetails] Response:', JSON.stringify(response));
      // Stash on success for the verify-email "Resend code" button — the
      // email OTP is (re)sent by re-submitting this payload (no dedicated
      // resend endpoint). Also marks this payload as already-saved for the
      // skip check above.
      accountDetailsStore.stash(payload);
      // Keep the registration token in memory — verify-email needs it for the
      // OTP call AND for resending the email. It is cleared after email
      // verification succeeds (see verify-email onVerified).
      router.push({
        pathname: '/(auth)/verify-email',
        params: { email: payload.email },
      });
    } catch (err: unknown) {
      const apiErr = toApiError(err);
      console.error('[AccountDetails] Error:', {
        message: apiErr.message,
        status: apiErr.status,
        traceId: apiErr.traceId,
      });
      if (apiErr.serverCode === 'ACCOUNT_EXISTS' || apiErr.status === 409) {
        setAccountExists(true);
        setError('email', { message: 'An account already exists with this email.' });
        toast({
          variant: 'error',
          title: 'An account already exists',
          description: 'Sign in instead, or use a different email.',
        });
        return;
      }
      toast({
        variant: 'error',
        title: "Couldn't save details",
        description: apiErr.message || 'Check the form and try again.',
      });
    }
  });

  if (!hasRegistrationToken) return <Redirect href="/(auth)/register" />;

  const pinMismatch = confirmPin.length === 4 && confirmPin !== pin;

  return (
    <AuthScreen
      header={<FlowBar title="About you" step={3} total={SIGNUP_STEPS} />}
      footer={
        <Button
          label="Continue"
          iconRight={ArrowRight}
          loading={completeAccount.isPending}
          onPress={() => void onSubmit()}
        />
      }>
      <Steps total={SIGNUP_STEPS} current={2} />
      <Heading
        title="A few"
        accent="details."
        sub="These secure your account and speed up venue check-in. Your name must match your government ID."
      />

      <View style={{ gap: 18 }}>
        <Txt v="micro">You</Txt>
        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value }, fieldState }) => (
            <Field
              label="Full name"
              icon={User}
              placeholder="As on your ID"
              value={value}
              onChangeText={onChange}
              error={fieldState.error?.message}
              hint="As on your government ID."
              inputProps={{ autoCapitalize: 'words', autoComplete: 'name', textContentType: 'name' }}
            />
          )}
        />
        <Controller
          control={control}
          name="dateOfBirth"
          render={({ field: { onChange, value }, fieldState }) => (
            <DateField
              label="Date of birth"
              placeholder="Select your date of birth"
              maxDate={latestAdultDob()}
              value={apiDateToIso(value)}
              onChange={(iso) => onChange(isoToApiDate(iso))}
              error={fieldState.error?.message}
              hint={`You must be ${ADULT_AGE} or older.`}
            />
          )}
        />
      </View>

      <View style={{ gap: 18 }}>
        <Txt v="micro">App PIN</Txt>
        <Controller
          control={control}
          name="pin"
          render={({ field: { onChange, value }, fieldState }) => (
            <PinField
              label="App PIN"
              value={value}
              onChange={onChange}
              error={fieldState.error?.message}
              hint="4 digits — used for quick unlock."
            />
          )}
        />
        <PinField
          label="Confirm PIN"
          value={confirmPin}
          onChange={(v) => {
            setConfirmPin(v);
            setConfirmPinError(undefined);
          }}
          error={confirmPinError ?? (pinMismatch ? "PINs don't match" : undefined)}
        />
      </View>

      <View style={{ gap: 18 }}>
        <Txt v="micro">Sign-in details</Txt>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState }) => (
            <Field
              label="Email"
              icon={Mail}
              placeholder="you@example.com"
              keyboardType="email-address"
              value={value}
              onChangeText={(v) => {
                onChange(v);
                setAccountExists(false);
              }}
              error={fieldState.error?.message}
              hint="We'll email you a code to confirm it."
              inputProps={{ autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email', textContentType: 'emailAddress' }}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value }, fieldState }) => (
            <PasswordField
              label="Password"
              placeholder="Create a password"
              value={value}
              onChangeText={onChange}
              error={fieldState.error?.message}
              hint="8+ characters with upper & lower case, a number and a symbol."
              autoComplete="new-password"
            />
          )}
        />
        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value }, fieldState }) => (
            <PasswordField
              label="Confirm password"
              placeholder="Repeat password"
              value={value}
              onChangeText={onChange}
              error={fieldState.error?.message}
            />
          )}
        />
      </View>

      {accountExists && (
        <Banner
          tone="warning"
          title="An account already exists"
          body="This email is already registered. Sign in instead."
          action={
            <TextLink
              label="Sign in"
              color={C.amberInk}
              onPress={() => {
                clearRegistrationToken();
                accountDetailsStore.clear();
                router.replace('/(auth)/login');
              }}
            />
          }
        />
      )}
    </AuthScreen>
  );
}
