import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { getOrRefreshAccessToken, SessionExpiredError } from '@/api/client';
import { Spinner } from '@/components/ui';
import { sessionStarted } from '@/features/auth/slice';
import { secureStorage } from '@/services/secureStorage';
import { useAppDispatch, useAppSelector } from '@/store';
import { useThemeTokens } from '@/theme';

/** Entry gate: restores the session from the persisted refresh token,
 *  then routes — unauthenticated → welcome; no face → mandatory
 *  enrollment (PRD); else tabs. */
export default function Index() {
  const dispatch = useAppDispatch();
  const theme = useThemeTokens();
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const refreshToken = await secureStorage.getRefreshToken();
        if (refreshToken) {
          const accessToken = await getOrRefreshAccessToken();
          const user = await api.getUser();
          if (!cancelled) {
            // Do NOT pass the refreshToken we read above — the refresh call
            // already rotated it and stored the new one. Re-persisting the
            // stale token overwrites the rotated one, and replaying a rotated
            // token revokes the whole family (contract) — that's what was
            // killing "Remember me" sessions.
            dispatch(sessionStarted({ user, accessToken }));
          }
        }
      } catch (e) {
        // No valid session — fall through to the unauthenticated route.
        // A rejected token is dead: drop it so it isn't replayed every launch.
        if (e instanceof SessionExpiredError) {
          await secureStorage.clearRefreshToken().catch(() => {});
        }
      } finally {
        if (!cancelled) {
          setRestoring(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  if (restoring) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}>
        <Spinner size="lg" label="Restoring session" />
      </View>
    );
  }

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!faceEnrolled) {
    return <Redirect href="/(onboarding)/consent" />;
  }
  return <Redirect href="/(tabs)" />;
}
