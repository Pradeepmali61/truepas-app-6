/** @jsxImportSource react */
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { ArrowRight, Phone } from 'lucide-react-native';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Text } from 'react-native';

import { toApiError } from '@/api/errors';
import { useToast } from '@/components/composite/Toast';
import { DEFAULT_COUNTRY_CODE } from '@/constants/countries';
import { useRegister } from '@/features/auth/mutations';
import { PhoneForm, phoneSchema } from '@/features/auth/schemas';
import { AuthScreen, CountryCodePicker, FlowBar, LinkRow, SIGNUP_STEPS } from '@/premium/flows/auth';
import { C, F } from '@/premium/theme';
import { Button, Field, Heading, Steps, Txt } from '@/premium/ui';

/** Register — step 1 (contract v1.1.0): POST /cb/auth/register { phone, countryCode }
 *  → registrationId → verify-phone with params. Phone only — name, DOB, PIN,
 *  email and password are collected on account-details after the SMS OTP. */
export default function RegisterScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const register = useRegister();
  const { control, handleSubmit } = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });
  const phone = useWatch({ control, name: 'phone' }) ?? '';

  const onSubmit = handleSubmit(async (values) => {
    if (register.isPending) return;
    const cleanPhone = values.phone.replace(/\D/g, '');
    try {
      const response = await register.mutateAsync({ phone: cleanPhone, countryCode });
      if (!response?.registrationId) {
        toast({
          variant: 'error',
          title: "Couldn't send code",
          description: 'Registration failed: server did not return a registration ID. Please try again.',
        });
        return;
      }
      router.push({
        pathname: '/(auth)/verify-phone',
        params: { phone: cleanPhone, countryCode, registrationId: response.registrationId },
      });
    } catch (err: unknown) {
      toast({
        variant: 'error',
        title: "Couldn't send code",
        description: toApiError(err).message || 'Check the number and try again.',
      });
    }
  });

  return (
    <AuthScreen
      header={
        <FlowBar
          title="Create account"
          step={1}
          total={SIGNUP_STEPS}
          onBack={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/welcome'))}
        />
      }
      footer={
        <>
          <Button
            label="Send code"
            iconRight={ArrowRight}
            loading={register.isPending}
            disabled={!phone.trim()}
            onPress={() => void onSubmit()}
          />
          <LinkRow prompt="Already have an account?" label="Sign in" onPress={() => router.push('/(auth)/login')} />
        </>
      }>
      <Steps total={SIGNUP_STEPS} current={0} />
      <Heading
        title="Create your"
        accent="Truepas."
        sub="One verified identity for every check-in. We'll text a verification code to your phone."
      />

      <Controller
        control={control}
        name="phone"
        render={({ field: { onChange, onBlur, value }, fieldState }) => (
          <Field
            label="Mobile number"
            icon={Phone}
            placeholder="98765 43210"
            keyboardType="phone-pad"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={fieldState.error?.message}
            hint="Enter your number without the country code."
            inputProps={{ autoComplete: 'tel', textContentType: 'telephoneNumber' }}
            right={<CountryCodePicker value={countryCode} onChange={setCountryCode} />}
          />
        )}
      />

      <Txt v="small" style={{ lineHeight: 19 }}>
        By continuing you agree to the{' '}
        <Text style={{ color: C.ink, fontFamily: F.bold }} accessibilityRole="link" onPress={() => router.push('/legal/terms')}>
          Terms of Service
        </Text>{' '}
        and acknowledge the{' '}
        <Text
          style={{ color: C.ink, fontFamily: F.bold }}
          accessibilityRole="link"
          onPress={() => router.push('/legal/privacy-policy')}>
          Privacy Policy
        </Text>
        .
      </Txt>
    </AuthScreen>
  );
}
