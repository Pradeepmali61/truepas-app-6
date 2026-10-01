/** @jsxImportSource react */
import { Image } from 'expo-image';
import { ArrowRight, Check } from 'lucide-react-native';
import { View } from 'react-native';

import { IMG } from '@/premium/images';
import { C } from '@/premium/theme';
import { Badge, Button, Card, go, Row, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/** Check-in success — CLEAR-style "You're in". */
export default function FaceSuccess() {
  return (
    <ResultView
      close
      icon={Check}
      tone="green"
      over="Matched in 0.8 seconds"
      title="Welcome,"
      accent="Pradeep."
      sub="You're checked in at Marine Bay Grand. Your room key is ready on your phone."
      primary={<Button label="Open digital key" iconRight={ArrowRight} onPress={go('/booking/t1')} />}
      secondary={<Button label="Back to home" tone="ghost" onPress={go('/(tabs)')} />}>
      <Card pad={0} style={{ overflow: 'hidden' }}>
        <Image source={IMG.room} style={{ height: 150 }} contentFit="cover" />
        <View style={{ padding: 18, gap: 8 }}>
          <Row between>
            <Txt v="h3">Room 1208</Txt>
            <Badge label="Checked in" tone="green" dot />
          </Row>
          <Row between>
            <Txt v="small">Deluxe Sea View · Floor 12</Txt>
            <Txt v="small" color={C.ink}>
              Until Sat, 11 AM
            </Txt>
          </Row>
        </View>
      </Card>
    </ResultView>
  );
}
