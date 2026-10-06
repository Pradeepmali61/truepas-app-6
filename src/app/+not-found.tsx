/** @jsxImportSource react */
import { useRouter } from 'expo-router';
import { Compass, House } from 'lucide-react-native';

import { Button } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** Any URL no route matches — a bad deep link or a stale in-app href —
 *  lands here instead of expo-router's stock "Unmatched Route" page. */
export default function NotFoundScreen() {
  const router = useRouter();

  // Same reset as the session-expired handler: drop the stack that led here,
  // then let the entry gate (`/`) route by session state.
  const goHome = () => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/');
  };

  return (
    <ResultView
      icon={Compass}
      over="Broken link"
      title="Page not"
      accent="found."
      sub="The link you followed may be broken, or the page may have moved."
      primary={<Button label="Back to home" icon={House} onPress={goHome} />}
    />
  );
}
