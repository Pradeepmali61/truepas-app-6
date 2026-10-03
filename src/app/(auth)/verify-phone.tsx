/** @jsxImportSource react */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { DEFAULT_COUNTRY_CODE } from '@/constants/countries';
import { OtpScreen, SIGNUP_STEPS } from '@/premium/flows/auth';

/** Verify phone OTP — registration flow step 2. The OTP screen stores the
 *  registrationToken and we navigate to account-details (NOT verify-email,
 *  per contract v1.1.0).
 *  Resend re-calls POST /auth/register (the backend has no dedicated resend
 *  endpoint) — a fresh registrationId is returned and used for verification. */
export default function VerifyPhoneScreen() {
  const router = useRouter();
  const { phone, countryCode, registrationId } = useLocalSearchParams<{
    phone?: string;
    countryCode?: string;
    registrationId?: string;
  }>();
  // Resend creates a NEW registration session — keep it in state so the
  // verify call uses the latest registrationId, not the stale param.
  const [activeRegistrationId, setActiveRegistrationId] = useState(registrationId ?? '');

  useEffect(() => {
    console.log('[VerifyPhone] Params received:', { phone, countryCode, registrationId });
    if (!registrationId || !phone) {
      // Direct navigation (dev-screen jump / reload on this route) — the OTP
      // verify call needs registrationId and resend needs phone. Send the
      // user back to register instead of rendering a broken OTP form.
      console.warn('[VerifyPhone] Missing registrationId/phone — redirecting to register.');
      router.replace('/(auth)/register');
    }
  }, [phone, countryCode, registrationId, router]);

  if (!registrationId || !phone) {
    return null;
  }

  // Non-breaking spaces keep the masked number on one line.
  const maskedPhone = `${countryCode ?? DEFAULT_COUNTRY_CODE}\u00A0•••\u00A0•••\u00A0${phone.replace(/\D/g, '').slice(-4)}`;

  return (
    <OtpScreen
      topTitle="Verify mobile"
      step={{ current: 2, total: SIGNUP_STEPS }}
      title="Enter the"
      accent="code."
      sub={`We sent a 6-digit code by SMS to ${maskedPhone}.`}
      purpose="phone"
      identifier={{ registrationId: activeRegistrationId, phone, countryCode: countryCode ?? DEFAULT_COUNTRY_CODE }}
      onResend={async () => {
        const res = await api.register({
          phone,
          countryCode: countryCode ?? DEFAULT_COUNTRY_CODE,
        });
        if (res.registrationId) {
          console.log('[VerifyPhone] Resent — new registrationId:', res.registrationId);
          setActiveRegistrationId(res.registrationId);
        }
      }}
      onVerified={() => router.push('/(auth)/account-details')}
      change={{ label: 'Change number' }}
    />
  );
}
