import { Stack } from 'expo-router';

/** Showcase build — no auth gating, every screen is reachable. */
export default function GroupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F6F8FA' },
      }}
    />
  );
}
