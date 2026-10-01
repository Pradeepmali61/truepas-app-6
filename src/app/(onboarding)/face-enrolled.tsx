/** @jsxImportSource react */
import { ArrowRight } from 'lucide-react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FaceRing, IdentityCard } from '@/premium/blocks';
import { USER } from '@/premium/data';
import { C } from '@/premium/theme';
import { Button, Footer, go, Heading } from '@/premium/ui';

/** Enrolment complete — "You're verified", the identity card is born. */
export default function FaceEnrolled() {
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 20, justifyContent: 'center', gap: 22 }}>
          <View style={{ alignItems: 'center' }}>
            <FaceRing size={176} mode="success" />
          </View>
          <Heading over="Identity ready" title="You're" accent="verified." center sub={`Welcome to Truepas, ${USER.first}. Your face now works as your pass at every partner venue.`} />
          <IdentityCard />
        </View>
        <Footer>
          <Button label="Start exploring" iconRight={ArrowRight} onPress={go('/(tabs)')} />
        </Footer>
      </SafeAreaView>
    </View>
  );
}
