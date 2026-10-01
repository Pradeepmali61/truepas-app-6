/** @jsxImportSource react */
import { Check } from 'lucide-react-native';

import { C } from '@/premium/theme';
import { Button, Card, go, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** Account deleted — graceful goodbye. */
export default function DeleteSuccess() {
  return (
    <ResultView
      close
      icon={Check}
      tone="sky"
      over="All done"
      title="Your account is"
      accent="deleted."
      sub="Your face template, documents and history have been permanently erased. Thank you for trusting Truepas."
      primary={<Button label="Back to start" onPress={go('/(auth)/welcome')} />}>
      <Card style={{ gap: 4, alignItems: 'center' }}>
        <Txt v="small">Confirmation sent to</Txt>
        <Txt v="bodyStrong">pradeep.mali@example.com</Txt>
      </Card>
      <Txt v="small" color={C.ink4} center>
        Changed your mind? You can create a new Truepas anytime.
      </Txt>
    </ResultView>
  );
}
