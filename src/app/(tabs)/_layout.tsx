/** @jsxImportSource react */
import { Redirect, Tabs } from 'expo-router';

import { TabBar, type TabKey } from '@/premium/blocks';
import { useAppSelector } from '@/store';

const KEY: Record<string, TabKey> = { index: 'home', history: 'trips', documents: 'wallet' };

/** Floating pill tab bar with the raised face-scan action in the centre. */
export default function TabsLayout() {
  const { status, faceEnrolled } = useAppSelector((state) => state.auth);
  if (status !== 'authenticated') return <Redirect href="/(auth)/welcome" />;
  if (!faceEnrolled) return <Redirect href="/(onboarding)/consent" />;
  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: '#F6F8FA' } }}
      tabBar={({ state }) => <TabBar active={KEY[state.routes[state.index].name] ?? 'home'} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="history" options={{ title: 'Check-ins' }} />
      <Tabs.Screen name="documents" options={{ title: 'Wallet' }} />
    </Tabs>
  );
}
