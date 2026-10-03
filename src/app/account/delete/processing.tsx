/** @jsxImportSource react */
import { Redirect, useRouter } from 'expo-router';
import { Check, Loader, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Medallion } from '@/premium/blocks';
import { C, S } from '@/premium/theme';
import { Card, Heading, Txt } from '@/premium/ui';
import { flowGuards } from '@/services/flowGuards';

const PROCESSING_MS = 2500;

const STEPS: { label: string; detail: string; done: boolean }[] = [
  { label: 'Account data removed', detail: 'PostgreSQL', done: true },
  { label: 'Images deleted', detail: 'S3', done: true },
  { label: 'Removing face template…', detail: 'Face gallery', done: false },
];

/**
 * Delete account — processing across PostgreSQL, S3, face gallery (PRD).
 * No back button: DELETE /user/me already succeeded, this only hands off
 * to the session-wiping success screen.
 */
export default function DeleteProcessingScreen() {
  const router = useRouter();
  // Only reachable after DELETE /user/me succeeded — a deep link here must not
  // fall through to the session-wiping success screen.
  const [allowed] = useState(() => flowGuards.has('account:deleting'));

  useEffect(() => {
    if (!allowed) return;
    const timer = setTimeout(() => {
      flowGuards.consume('account:deleting');
      flowGuards.grant('account:deleted');
      router.replace('/account/delete/success');
    }, PROCESSING_MS);
    return () => clearTimeout(timer);
  }, [router, allowed]);

  if (!allowed) return <Redirect href="/" />;

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, justifyContent: 'center', paddingHorizontal: S.gutter, gap: 28 }}>
        <View style={{ alignItems: 'center' }}>
          <Medallion icon={Trash2} tone="red" size={80} />
        </View>
        <View accessibilityLiveRegion="polite">
          <Heading title="Deleting your" accent="data…" sub="Please keep the app open. This takes a few seconds." center />
        </View>
        <Card pad={6} style={{ paddingHorizontal: 18 }}>
          {STEPS.map((s, i) => (
            <View
              key={s.label}
              style={{
                flexDirection: 'row',
                gap: 14,
                paddingVertical: 14,
                alignItems: 'center',
                borderTopWidth: i ? 1 : 0,
                borderTopColor: C.lineSoft,
              }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: s.done ? C.sky : C.skyWash,
                }}>
                {s.done ? <Check size={16} color={C.white} strokeWidth={3} /> : <Spinning />}
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{s.label}</Txt>
                <Txt v="small">{s.detail}</Txt>
              </View>
              {s.done && (
                <Txt v="small" color={C.green}>
                  Done
                </Txt>
              )}
            </View>
          ))}
        </Card>
      </SafeAreaView>
    </View>
  );
}

function Spinning() {
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [v]);
  const rotate = v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Loader size={16} color={C.skyPressed} strokeWidth={2.6} />
    </Animated.View>
  );
}
