/** @jsxImportSource react */
import { Glasses, RotateCcw, ScanFace, Sun, UserRound } from 'lucide-react-native';

import { Button, go, Group, ListRow } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** Couldn't match — friendly, specific tips. */
export default function FaceError() {
  return (
    <ResultView
      icon={ScanFace}
      tone="amber"
      over="Let's try that again"
      title="We couldn't"
      accent="see you."
      sub="Nothing's wrong with your account — the camera just needs a clearer view."
      primary={<Button label="Try again" icon={RotateCcw} onPress={go('/face-update/camera')} />}
      secondary={<Button label="Use PIN instead" tone="ghost" onPress={go('/face-update/pin')} />}>
      <Group title="Quick tips">
        <ListRow icon={Sun} tone="amber" title="Find even light" sub="Avoid bright light behind you" chevron={false} />
        <ListRow icon={Glasses} tone="amber" title="Remove sunglasses or mask" chevron={false} />
        <ListRow icon={UserRound} tone="amber" title="Hold the phone at eye level" chevron={false} />
      </Group>
    </ResultView>
  );
}
