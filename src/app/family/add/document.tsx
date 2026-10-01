/** @jsxImportSource react */
import { BookUser, Fingerprint, IdCard, ScrollText } from 'lucide-react-native';

import { C } from '@/premium/theme';
import { Badge, Group, go, Heading, ListRow, Screen, Steps, TopBar, Txt } from '@/premium/ui';

/** Add member — step 2: pick an ID document. */
export default function AddMemberDocument() {
  return (
    <Screen header={<TopBar title="Add member" right={<Txt v="smallStrong" color={C.ink3}>2/4</Txt>} />} contentStyle={{ paddingTop: 8 }}>
      <Steps total={4} current={1} />
      <Heading title="Scan Kiara's" accent="ID." sub="Choose a government document. We'll read it automatically — no typing." />
      <Group title="Recommended for children">
        <ListRow icon={ScrollText} tone="sky" title="Birth certificate" sub="Fastest for under-18s" trailing={<Badge label="Popular" tone="sky" />} onPress={go('/family/add/photo-capture')} />
        <ListRow icon={Fingerprint} tone="sky" title="Aadhaar" sub="Front side only" onPress={go('/family/add/photo-capture')} />
      </Group>
      <Group title="Other documents">
        <ListRow icon={BookUser} title="Passport" sub="Photo page" onPress={go('/family/add/photo-capture')} />
        <ListRow icon={IdCard} title="School ID" sub="Accepted with guardian consent" onPress={go('/family/add/photo-capture')} />
      </Group>
    </Screen>
  );
}
