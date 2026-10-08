/** @jsxImportSource react */
import { Redirect, useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { faceEnrollmentCompleted } from '@/features/auth/slice';
import { useProfilePicture } from '@/features/profile/hooks';
import { FaceRing, IdentityCard } from '@/premium/blocks';
import { C } from '@/premium/theme';
import { Button, Footer, Heading } from '@/premium/ui';
import { flowGuards } from '@/services/flowGuards';
import { useAppDispatch, useAppSelector } from '@/store';

/** Face enrolled success (POST /cb/face/enroll) — the enroll call already
 *  completed in LivenessCamera; this confirms and leads into the app.
 *  Deep-linking here is bounced back to face-scan: only a real enrollment
 *  may flip faceEnrolled. */
export default function FaceEnrolledScreen() {
  const [allowed] = useState(() => flowGuards.has('onboarding:face-enrolled'));

  useEffect(() => {
    if (allowed) flowGuards.consume('onboarding:face-enrolled');
  }, [allowed]);

  if (!allowed) return <Redirect href="/(onboarding)/face-scan" />;
  return <Enrolled />;
}

function Enrolled() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { url: photoUrl } = useProfilePicture();
  const firstName = user?.fullName?.trim().split(/\s+/)[0];

  const handleContinue = () => {
    dispatch(faceEnrollmentCompleted());
    router.replace('/(tabs)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 24, gap: 22 }}
          showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center' }}>
            <FaceRing size={176} mode="success" photo={!!photoUrl} uri={photoUrl} />
          </View>
          <Heading
            over="Face enrolled"
            title="You're all"
            accent="set."
            center
            sub={`${firstName ? `Welcome to TruePas, ${firstName}. ` : ''}Check in at venues with a glance — no documents needed.`}
          />
          {user != null && (
            <IdentityCard
              // Explicit fallbacks: IdentityCard's defaults are showcase data.
              name={user.fullName ?? ''}
              idLine={user.email ?? ''}
              photoUri={photoUrl ?? null}
              verified
              statusLabel="Face enrolled"
              meta={[
                { k: 'Face ID', v: 'Enrolled' },
                { k: 'Status', v: 'Active' },
              ]}
            />
          )}
        </ScrollView>
        <Footer>
          <Button label="Continue to TruePas" iconRight={ArrowRight} onPress={handleContinue} />
        </Footer>
      </SafeAreaView>
    </View>
  );
}
