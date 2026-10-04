import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { SessionExpiredError, setOnSessionExpired } from '@/api/client';
import { FieldLabelStyleProvider, ToastProvider } from '@/components/composite';
import { sessionEnded } from '@/features/auth/slice';
import { clearAllProfileImages } from '@/services/profileImageStore';
import { store } from '@/store';
import { C } from '@/premium/theme';
import { ThemeProvider, useTruepasFonts } from '@/theme';

import '@/global.css';
import { AppLock } from '@/features/settings/AppLock';
import { loadPrefs } from '@/services/prefs';

// Settings (haptics, app lock) are read once, before anything uses them.
void loadPrefs();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // A dead session can't be fixed by retrying — it would just re-fire
      // the refresh failure and the session-expired handler.
      retry: (failureCount, error) =>
        !(error instanceof SessionExpiredError) && failureCount < 2,
      staleTime: 60_000,
    },
  },
});

// React Query only knows about browser focus. On native, tell it when the app
// returns to the foreground so stale queries (e.g. check-in history after a
// venue check-in) refetch without a manual pull-to-refresh.
if (Platform.OS !== 'web') {
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
    return () => sub.remove();
  });
}

// The API client fires this when the refresh token is missing or rejected.
// Without it the app stayed "authenticated" in Redux while every request
// 401'd — the repeated NO_REFRESH_TOKEN / "couldn't load" error loop.
setOnSessionExpired(() => {
  queryClient.clear();
  store.dispatch(sessionEnded());
  // Forced logout gets the same teardown as a manual logout. Captured
  // document scans are kept — the backend can't return them, so wiping
  // here lost every passport photo on token expiry (see useLogoutFlow).
  void clearAllProfileImages().catch(() => {});
  if (router.canDismiss()) {
    router.dismissAll();
  }
  // reason → the login screen explains why the session ended instead of
  // dumping the user on a bare login form.
  router.replace({ pathname: '/(auth)/login', params: { reason: 'session-expired' } } as never);
});

function RootShell({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useTruepasFonts();
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: C.canvas }} />;
  }

  return (
    <>
      <StatusBar style="dark" />
      {children}
      <AppLock />
    </>
  );
}

/** Renders inside ThemeProvider so the stack's behind-screen color tracks
 *  the active palette instead of flashing white during transitions. */
function RootStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        // Premium showcase canvas

        contentStyle: { backgroundColor: C.canvas },
      }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeProvider scheme="light"palette="violetLedger" typeface="grotesk">
            <FieldLabelStyleProvider>
              <ToastProvider>
                <RootShell>
                  <RootStack />
                </RootShell>
              </ToastProvider>
            </FieldLabelStyleProvider>
          </ThemeProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
}
