/** @jsxImportSource react */
import { useLocalSearchParams } from 'expo-router';
import { BedDouble, Plane, RefreshCw, Share2, Trash2 } from 'lucide-react-native';
import { View } from 'react-native';

import { DocCard } from '@/premium/blocks';
import { DOCS } from '@/premium/data';
import { C } from '@/premium/theme';
import { Button, Group, IconCircle, ListRow, Row, Screen, TopBar, Txt } from '@/premium/ui';

/** Document detail — the card, its data, where it was used. */
export default function DocumentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const doc = DOCS.find((d) => d.id === id) ?? DOCS[0];
  return (
    <Screen header={<TopBar title={doc.title} right={<IconCircle icon={Share2} label="Share" />} />} contentStyle={{ paddingTop: 8 }}>
      <DocCard doc={doc} height={212} />
      <Row gap={10}>
        <View style={{ flex: 1 }}>
          <Button label="Share" icon={Share2} size="md" />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Replace" tone="white" icon={RefreshCw} size="md" />
        </View>
      </Row>
      <Group title="Details">
        <ListRow title="Holder" value="Pradeep Mali" chevron={false} />
        <ListRow title="Number" value={doc.number} chevron={false} />
        <ListRow title="Issued by" value={doc.issuer} chevron={false} />
        <ListRow title="Validity" value={doc.expires} chevron={false} />
        <ListRow title="Verified on" value="12 Mar 2026" chevron={false} />
      </Group>
      <Group title="Recently used at">
        <ListRow icon={BedDouble} tone="sky" title="Aravali Palace, Jaipur" sub="Hotel check-in · 21 Sep" chevron={false} />
        <ListRow icon={Plane} tone="sky" title="Mumbai Airport T2" sub="Boarding · 14 Sep" chevron={false} />
      </Group>
      <ListRow icon={Trash2} danger title="Remove from wallet" chevron={false} />
      <Txt v="small" color={C.ink4} center>
        Venues never see this document — only a verified yes.
      </Txt>
    </Screen>
  );
}
