/** @jsxImportSource react */
import { Redirect, Tabs } from 'expo-router';

import { PremiumTabBar } from '@/premium/flows/tabs';
import { C } from '@/premium/theme';
import { useAppSelector } from '@/store';

/** Floating pill tab bar (Home · Check-ins · face · Wallet · Family). The
 *  centre face button opens Your identity (the face pass). */
export default function TabsLayout() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);

  if (status !== 'authenticated') {
    return <Redirect href="/(auth)/welcome" />;
  }
  if (!faceEnrolled) {
    return <Redirect href="/(onboarding)/consent" />;
  }

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: C.canvas } }}
      tabBar={(props) => <PremiumTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'Check-ins' }} />
      <Tabs.Screen name="documents" options={{ title: 'Wallet' }} />
    </Tabs>
  );
}
