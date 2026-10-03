/** @jsxImportSource react */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowRight, Mail, Phone, ScanFace } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { DEFAULT_COUNTRY_CODE } from '@/constants/countries';
import { loginSchema } from '@/features/auth/schemas';
import { sessionStarted } from '@/features/auth/slice';
import { AuthScreen, CountryCodePicker, LinkRow, PasswordField, Segmented } from '@/premium/flows/auth';
import { Banner, ComingSoon } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Field, Heading, Row, TextLink, TopBar, Txt } from '@/premium/ui';
import { useAppDispatch } from '@/store';

type IdentifierMode = 'email' | 'phone';

/**
 * Login — POST /auth/login { identifier, password } → AuthResponse.
 * sessionStarted stores tokens + user; the (auth) layout then redirects to
 * consent automatically when faceEnrolled is false.
 * The phone-number normalization, session-expired banner and 429 Retry-After
 * messaging are our real backend contract.
 */
export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  // Set by the session-expired handler in _layout — explains why the user
  // landed here instead of silently dropping them on a bare login form.
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const [mode, setMode] = useState<IdentifierMode>('email');
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [identifierError, setIdentifierError] = useState<string>();
  const [passwordError, setPasswordError] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    const parsed = loginSchema.safeParse({ identifier, password });
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setIdentifierError(fields.identifier?.[0]);
      setPasswordError(fields.password?.[0]);
      return;
    }
    setLoading(true);
    setFormError(null);
    try {
      let value = identifier.trim();
      if (mode === 'phone') {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          setIdentifierError('Enter a valid mobile number');
          return;
        }
        const cc = countryCode.slice(1);
        // A bare national number is ≤10 digits — always prepend the country
        // code. Only treat it as already-international when it's longer AND
        // starts with the cc digits (a 10-digit number can itself start with
        // '91', e.g. 9198765432, and must still get the +91 prefix).
        value = digits.startsWith(cc) && digits.length > 10 ? `+${digits}` : `${countryCode}${digits}`;
      }

      const { user, accessToken, refreshToken } = await api.login({
        identifier: value,
        password,
      });

      if (!accessToken || !refreshToken) {
        setFormError('Login incomplete — tokens missing. Please finish registration or contact support.');
        return;
      }

      dispatch(sessionStarted({ user, accessToken, refreshToken }));
    } catch (error) {
      const apiErr = toApiError(error);
      // Surface the server's Retry-After on 429/lockout so the user knows
      // when the next attempt will work instead of hammering the button.
      setFormError(
        apiErr.retryAfterSeconds ? `${apiErr.message} Try again in ${apiErr.retryAfterSeconds}s.` : apiErr.message,
      );
    } finally {
      setLoading(false);
    }
  };

  const onIdentifierChange = (v: string) => {
    setIdentifier(v);
    setIdentifierError(undefined);
    setFormError(null);
  };

  return (
    <AuthScreen
      header={<TopBar />}
      footer={<LinkRow prompt="New to Truepas?" label="Create an account" onPress={() => router.push('/(auth)/register')} />}>
      <Heading title="Welcome" accent="back." sub="Sign in to your digital identity with your email or mobile number." />

      {reason === 'session-expired' ? (
        <Banner
          tone="warning"
          title="Session expired"
          body="For your security, you were signed out. Please sign in again to continue."
        />
      ) : null}

      <Segmented<IdentifierMode>
        label="Sign in method"
        options={[
          { value: 'email', label: 'Email' },
          { value: 'phone', label: 'Mobile' },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m);
          setIdentifier('');
          setIdentifierError(undefined);
          setFormError(null);
        }}
      />

      <View style={{ gap: 18 }}>
        {mode === 'email' ? (
          <Field
            key="email"
            label="Email"
            icon={Mail}
            placeholder="you@example.com"
            keyboardType="email-address"
            value={identifier}
            onChangeText={onIdentifierChange}
            error={identifierError}
            inputProps={{ autoCapitalize: 'none', autoCorrect: false, autoComplete: 'email', textContentType: 'username' }}
          />
        ) : (
          <Field
            key="phone"
            label="Mobile number"
            icon={Phone}
            placeholder="98765 43210"
            keyboardType="phone-pad"
            value={identifier}
            onChangeText={onIdentifierChange}
            error={identifierError}
            inputProps={{ autoCapitalize: 'none', autoCorrect: false, autoComplete: 'tel' }}
            right={<CountryCodePicker value={countryCode} onChange={setCountryCode} />}
          />
        )}
        <PasswordField
          label="Password"
          placeholder="Your password"
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            setPasswordError(undefined);
            setFormError(null);
          }}
          error={passwordError}
          autoComplete="current-password"
        />

        {formError ? <Banner tone="error" body={formError} /> : null}

        <Row style={{ justifyContent: 'flex-end' }}>
          <TextLink label="Forgot password?" onPress={() => router.push('/(auth)/forgot-password')} />
        </Row>
      </View>

      <View style={{ gap: 14 }}>
        <Button
          label="Sign in"
          iconRight={ArrowRight}
          loading={loading}
          disabled={!identifier.trim() || !password}
          onPress={() => void submit()}
        />
        <Row gap={12}>
          <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
          <Txt v="small">or</Txt>
          <View style={{ flex: 1, height: 1, backgroundColor: C.line }} />
        </Row>
        {/* Face sign-in has no backend endpoint yet — shown, but inert. */}
        <View accessibilityState={{ disabled: true }} accessibilityHint="Coming soon">
          <Button label="Sign in with your face" tone="white" icon={ScanFace} disabled />
          <View pointerEvents="none" style={{ position: 'absolute', top: -11, right: 18 }}>
            <ComingSoon />
          </View>
        </View>
      </View>
    </AuthScreen>
  );
}
