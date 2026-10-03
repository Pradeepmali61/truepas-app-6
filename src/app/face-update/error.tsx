/** @jsxImportSource react */
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { RotateCcw, TriangleAlert } from 'lucide-react-native';

import { RETRY_TIPS } from '@/premium/flows/face';
import { Banner } from '@/premium/kit';
import { Button, Group, ListRow } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** Update face — retry error. Never marks success on failure (PRD).
 *  `retry` param (when set) routes Retry back to the flow that failed —
 *  registration passes '/(onboarding)/face-scan', the default is the
 *  face-update camera. */
export default function FaceUpdateErrorScreen() {
  const router = useRouter();
  const { message, retry } = useLocalSearchParams<{ message?: string; retry?: string }>();

  return (
    <ResultView
      close
      icon={TriangleAlert}
      tone="red"
      over="Face update"
      title="That didn't"
      accent="go through."
      sub={message ?? "We couldn't complete your face update. Please try again later."}
      primary={
        <Button
          label="Retry now"
          icon={RotateCcw}
          onPress={() => router.replace((retry ?? '/face-update/camera') as Href)}
        />
      }
      secondary={<Button label="Try again later" tone="ghost" onPress={() => router.dismissTo('/(tabs)')} />}>
      <Banner tone="error" body="Your face has NOT been marked as updated. Please retry." />
      <Group title="Quick tips">
        {RETRY_TIPS.map((t) => (
          <ListRow key={t.title} icon={t.icon} tone="amber" title={t.title} sub={t.sub} chevron={false} />
        ))}
      </Group>
    </ResultView>
  );
}
