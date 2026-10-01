/** @jsxImportSource react */
import { Cake, Send } from 'lucide-react-native';
import { View } from 'react-native';

import { C } from '@/premium/theme';
import { Avatar, Button, Card, Divider, Row, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** A family member turns 18 — warm milestone + hand-over of their identity. */
export default function Age18() {
  return (
    <ResultView
      icon={Cake}
      tone="sky"
      over="A milestone"
      title="Meera is now"
      accent="18."
      sub="She can now own her Truepas. Send her an invite to take over her verified identity — her history comes with her."
      primary={<Button label="Send invite to Meera" icon={Send} />}
      secondary={<Button label="Remind me later" tone="ghost" />}>
      <Card style={{ gap: 14 }}>
        <Row gap={14}>
          <Avatar src="sister" size={56} status="verified" />
          <View style={{ flex: 1 }}>
            <Txt v="h3">Meera Mali</Txt>
            <Txt v="small">Verified since Jun 2025 · 14 check-ins</Txt>
          </View>
        </Row>
        <Divider />
        {['Her face & documents move to her own account', 'You stay connected as family', 'Guardian controls switch off automatically'].map((t) => (
          <Row key={t} gap={10}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.sky }} />
            <Txt v="body">{t}</Txt>
          </Row>
        ))}
      </Card>
    </ResultView>
  );
}
