/** @jsxImportSource react */
import { Check } from 'lucide-react-native';

import { DocCard } from '@/premium/blocks';
import { DOCS } from '@/premium/data';
import { Button, go, Group, ListRow } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** Document verified — success with extracted fields. */
export default function DocVerified() {
  return (
    <ResultView
      close
      icon={Check}
      tone="green"
      over="Verification complete"
      title="Passport"
      accent="verified."
      sub="It's now in your wallet and linked to your face."
      primary={<Button label="Go to wallet" onPress={go('/(tabs)/documents')} />}
      secondary={<Button label="Add another document" tone="ghost" onPress={go('/document/select-type')} />}>
      <DocCard doc={DOCS[0]} />
      <Group title="Read from your document">
        <ListRow title="Full name" value="PRADEEP MALI" chevron={false} />
        <ListRow title="Passport no." value="Z•••• 4821" chevron={false} />
        <ListRow title="Date of birth" value="14 Aug 1994" chevron={false} />
        <ListRow title="Expiry" value="16 Jan 2033" chevron={false} />
      </Group>
    </ResultView>
  );
}
