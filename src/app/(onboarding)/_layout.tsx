import { Redirect, Stack } from 'expo-router';

import { useAppSelector } from '@/store';
import { C } from '@/premium/theme';

/** Mandatory face-enrollment gate — no skip path (PRD requirement). */
export default function OnboardingLayout() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (faceEnrolled) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: false,
        contentStyle: { backgroundColor: C.canvas },
      }}
    />
  );
}
