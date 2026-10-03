/** @jsxImportSource react */
/**
 * Add family — step 3: liveness + face enrollment for ages 5+.
 * Shows the checklist intro first, then mounts LivenessCamera with personId
 * for family member face enrollment (the camera owns its own stages — see
 * AGENTS.md: don't re-mount or wrap the Camera). The member was created in
 * processing, which passes personId here. Members under 10 get the
 * front/back camera toggle (a parent holds the phone while the child faces
 * the rear camera); 10+ stays front-only.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, ListChecks, ScanFace, Sun, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { loadLivenessCamera } from '@/features/liveness/cameraModule';
import { FaceRing } from '@/premium/blocks';
import { CameraUnavailableView, GlassPill, GlassRow, NightStage } from '@/premium/flows/family';
import { Button, Row, Txt } from '@/premium/ui';

const LivenessCamera = loadLivenessCamera();

const CHECKLIST: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: ListChecks, title: 'Follow the prompts', body: 'A few quick movements on camera.' },
  { icon: Sun, title: 'Good light', body: 'Hold still facing the camera.' },
  { icon: CircleCheck, title: 'Automatic enrollment', body: 'The face enrolls as soon as liveness passes.' },
];

export default function FamilyFaceCaptureScreen() {
  const router = useRouter();
  const { personId, name, age } = useLocalSearchParams<{ personId?: string; name?: string; age?: string }>();
  const ageNum = age != null ? Number(age) : NaN;
  const allowBackCamera = Number.isFinite(ageNum) && ageNum < 10;
  const [started, setStarted] = useState(false);

  const goToMemberDetail = () => {
    if (personId) {
      router.replace({ pathname: '/family/[id]', params: { id: personId } });
    } else {
      router.dismissTo('/(tabs)');
    }
  };

  if (!started) {
    return (
      <NightStage
        topTitle="Face enrollment"
        subtitle={Number.isFinite(ageNum) ? `Age ${ageNum} · liveness` : 'Liveness check'}
        right={
          <Txt v="smallStrong" color="rgba(255,255,255,0.6)">
            3/3
          </Txt>
        }
        onBack={() => router.back()}
        step={3}
        total={3}
        title={name ? 'Now scan' : 'Liveness'}
        accent={name ?? 'check'}
        instruction={
          allowBackCamera
            ? 'A short liveness check. You can hold the phone and use the back camera.'
            : 'A short liveness check on the front camera.'
        }
        footer={<Button label="Start face verification" icon={ScanFace} onPress={() => setStarted(true)} />}>
        <View style={{ alignItems: 'center' }}>
          <FaceRing dark size={190} mode="idle" photo={false} />
        </View>
        <View
          style={{
            gap: 14,
            padding: 16,
            borderRadius: 22,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}>
          {CHECKLIST.map((c) => (
            <GlassRow key={c.title} icon={c.icon} title={c.title} body={c.body} />
          ))}
        </View>
        <Row gap={8} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
          <GlassPill label="Front camera" active />
          {allowBackCamera && <GlassPill label="Back camera" active />}
        </Row>
      </NightStage>
    );
  }

  if (!LivenessCamera) return <CameraUnavailableView />;

  return (
    <LivenessCamera
      mode="enroll"
      personId={personId}
      allowBackCamera={allowBackCamera}
      onSuccess={goToMemberDetail}
    />
  );
}
