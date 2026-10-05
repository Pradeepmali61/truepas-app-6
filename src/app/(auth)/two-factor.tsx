/** @jsxImportSource react */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Mail, ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import { Animated, View } from 'react-native';

import { api } from '@/api';
import { toApiError } from '@/api/errors';
import { profileUpdated, sessionStarted } from '@/features/auth/slice';
import { AuthScreen, LinkRow } from '@/premium/flows/auth';
import { Banner, CodeInput } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Heading, Tile, TopBar, Txt } from '@/premium/ui';
import { errorHaptic, successHaptic } from '@/services/haptics';
import { useAppDispatch } from '@/store';

const CODE_LENGTH = 6;

/**
 * 2-step sign-in — the code screen after POST /auth/login answered 202
 * { nextStep: 'verify2fa', challengeId, method } (backend Oct 2026 §4.4).
 *
 * POST /auth/2fa/verify { challengeId, code } → tokens → sessionStarted, and
 * the (auth) layout routes on like a normal sign-in.
 * - 400 TWO_FACTOR_INVALID: wrong or expired code → inline error, code cleared.
 * - 429 TWO_FACTOR_LOCKED: this challenge is over → back to sign in.
 * The verify response has no photo URL (only profileImageKey), so /user/me is
 * fetched right after to fill the session user.
 */
export default function TwoFactorScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { challengeId, method } = useLocalSearchParams<{ challengeId?: string; method?: string }>();
  const isTotp = method === 'totp';
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [shakeX] = useState(() => new Animated.Value(0));

  const backToLogin = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'));

  const shake = () =>
    Animated.sequence(
      [-10, 10, -6, 6, 0].map((toValue) => Animated.timing(shakeX, { toValue, duration: 50, useNativeDriver: true })),
    ).start();

  const verify = async (submitted?: string) => {
    const value = submitted ?? code;
    if (!challengeId || value.length !== CODE_LENGTH || busy || locked) return;
    setBusy(true);
    setError(null);
    try {
      const { user, accessToken, refreshToken } = await api.verifyTwoFactor({ challengeId, code: value });
      successHaptic();
      dispatch(sessionStarted({ user, accessToken, refreshToken }));
      // Fill profileImageUrl (and the other /user/me fields) in the background.
      api
        .getUser()
        .then((me) => dispatch(profileUpdated(me)))
        .catch(() => {});
    } catch (err) {
      const apiErr = toApiError(err);
      errorHaptic();
      shake();
      setCode('');
      if (apiErr.serverCode === 'TWO_FACTOR_LOCKED' || apiErr.status === 429) {
        setLocked(true);
      } else {
        setError(
          apiErr.serverCode === 'TWO_FACTOR_INVALID' || apiErr.status === 400
            ? 'That code is wrong or has expired. Try again.'
            : apiErr.message,
        );
      }
    } finally {
      setBusy(false);
    }
  };

  if (!challengeId) return <Redirect href="/(auth)/login" />;

  return (
    <AuthScreen
      header={<TopBar title="2-step sign-in" onBack={backToLogin} />}
      footer={
        locked ? (
          <Button label="Back to sign in" onPress={backToLogin} />
        ) : (
          <>
            <Button
              label="Verify"
              loading={busy}
              disabled={code.length !== CODE_LENGTH || busy}
              onPress={() => void verify()}
            />
            {!isTotp && <LinkRow prompt="No code?" label="Sign in again" onPress={backToLogin} />}
          </>
        )
      }>
      <Tile icon={isTotp ? ShieldCheck : Mail} tone="sky" size={60} />
      {isTotp ? (
        <Heading title="Enter your" accent="code." sub="Enter the 6-digit code from your authenticator app." />
      ) : (
        <Heading title="Check your" accent="email." sub="We emailed a 6-digit code to your email. Enter it to finish signing in." />
      )}

      <Animated.View style={{ transform: [{ translateX: shakeX }] }}>
        <CodeInput
          length={CODE_LENGTH}
          value={code}
          onChange={(v) => {
            setCode(v);
            if (error) setError(null);
          }}
          onComplete={(v) => void verify(v)}
          error={error != null}
          disabled={busy || locked}
          label="Sign-in code"
        />
      </Animated.View>

      {locked ? (
        <Banner tone="error" title="Too many wrong codes" body="For your security, start signing in again." />
      ) : error ? (
        <Banner tone="error" body={error} />
      ) : null}

      {!isTotp && !locked && (
        <View style={{ alignItems: 'center' }}>
          <Txt v="small" color={C.ink4} center style={{ maxWidth: 290 }}>
            Can&apos;t find it? Check your spam or promotions folder.
          </Txt>
        </View>
      )}
    </AuthScreen>
  );
}
