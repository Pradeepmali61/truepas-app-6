/** @jsxImportSource react */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { ShieldCheck, Sparkles } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Badge, Button } from '@/premium/ui';
import { ResultView } from '@/premium/views';
import { flowGuards } from '@/services/flowGuards';

/** Update face — success. Only reachable after the camera flow confirmed a
 *  server-side face update (PUT /face) — or, with `enrolled=1`, a first-time
 *  enrolment (POST /face/enroll). */
export default function FaceUpdateSuccessScreen() {
  const router = useRouter();
  const { enrolled } = useLocalSearchParams<{ enrolled?: string }>();
  const [allowed] = useState(() => flowGuards.has('face-update:done'));

  useEffect(() => {
    if (allowed) flowGuards.consume('face-update:done');
  }, [allowed]);

  if (!allowed) return <Redirect href="/" />;

  return (
    <ResultView
      close
      icon={ShieldCheck}
      tone="green"
      over="Verified & secure"
      title="Face"
      accent={enrolled === '1' ? 'enrolled.' : 'updated.'}
      sub={
        enrolled === '1'
          ? 'Your face is set up and ready for secure authentication.'
          : 'Your biometric profile is updated and ready for secure authentication.'
      }
      primary={<Button label="Done" onPress={() => router.dismissTo('/(tabs)')} />}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        <Badge label="Bank-grade encryption" tone="neutral" icon={ShieldCheck} />
        <Badge label="Instant auth enabled" tone="neutral" icon={Sparkles} />
      </View>
    </ResultView>
  );
}
