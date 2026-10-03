/** @jsxImportSource react */
/**
 * Age-18 transition notification — a dependent has turned 18 and is eligible
 * for their own Truepas account. Static content (no age-18 endpoint yet).
 */
import { useRouter } from 'expo-router';
import { Cake, Clock, Plus } from 'lucide-react-native';
import { View } from 'react-native';

import { Banner } from '@/premium/kit';
import { Avatar, Button, Card, Divider, Row, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';

export default function Age18NotificationScreen() {
  const router = useRouter();
  return (
    <ResultView
      icon={Cake}
      tone="sky"
      over="A milestone"
      title="Max Kim is now"
      accent="18."
      sub="They're eligible for a new Truepas account and can now manage their own identity verification."
      primary={
        <Button
          label="Create their account"
          icon={Plus}
          onPress={() => router.dismissTo('/(tabs)')}
        />
      }
      secondary={<Button label="Remind me later" icon={Clock} tone="ghost" onPress={() => router.back()} />}
    >
      <Card style={{ gap: 14 }}>
        <Row gap={14}>
          <Avatar name="Max Kim" size={56} />
          <View style={{ flex: 1, gap: 2 }}>
            <Txt v="h3">Max Kim</Txt>
            <Txt v="small">Has turned 18</Txt>
          </View>
        </Row>
        <Divider />
        <View style={{ gap: 10 }}>
          <Banner tone="success" title="Eligible to create own account" />
          <Banner tone="warning" title="Data retained for 30 days after removal" />
        </View>
      </Card>
    </ResultView>
  );
}
