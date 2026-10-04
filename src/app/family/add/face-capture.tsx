/** @jsxImportSource react */
/**
 * Add family — step 3: liveness + face enrollment for ages 5+.
 * Shows the checklist intro first, then mounts LivenessCamera with personId
 * for family member face enrollment (the camera owns its own stages — see
 * AGENTS.md: don't re-mount or wrap the Camera). The member was created in
 * processing, which passes personId here. Members under 10 get the
 * front/back camera toggle (a parent holds the phone while the child faces
 * the rear camera); 10+ stays front-only.
 *
 * Update mode (`update=1`, from the member page via the PIN screen): same
 * intro with update copy, LivenessCamera runs mode 'update' (PUT /face with
 * personId) and the screen pops back to the member page. Without the PIN
 * flag it bounces to /face-update/pin.
 */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { CircleCheck, ListChecks, RefreshCcw, ScanFace, Sun, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { useToast } from '@/components/composite/Toast';
import { useMemberFaceUpdateGate } from '@/features/family/hooks';
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

const UPDATE_CHECKLIST: { icon: LucideIcon; title: string; body: string }[] = [
  ...CHECKLIST.slice(0, 2),
  { icon: RefreshCcw, title: 'Replaces the old face', body: 'The new face is saved as soon as liveness passes.' },
];

export default function FamilyFaceCaptureScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const { personId, name, age, update } = useLocalSearchParams<{
    personId?: string;
    name?: string;
    age?: string;
    update?: string;
  }>();
  const isUpdate = update === '1' && !!personId;
  const pinVerified = useMemberFaceUpdateGate(isUpdate);
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

  // Update: the member page is already under us — pop back to it.
  const backToMember = () => {
    toast({ variant: 'success', title: 'Face updated' });
    router.dismissTo({ pathname: '/family/[id]', params: { id: personId! } });
  };

  if (isUpdate && !pinVerified) {
    return (
      <Redirect
        href={{
          pathname: '/face-update/pin',
          params: { personId: personId!, capture: 'liveness', ...(name ? { name } : {}), ...(age ? { age } : {}) },
        }}
      />
    );
  }

  if (!started) {
    return (
      <NightStage
        topTitle={isUpdate ? 'Update face' : 'Face enrollment'}
        subtitle={Number.isFinite(ageNum) ? `Age ${ageNum} · liveness` : 'Liveness check'}
        right={
          isUpdate ? undefined : (
            <Txt v="smallStrong" color="rgba(255,255,255,0.6)">
              3/3
            </Txt>
          )
        }
        onBack={() => router.back()}
        step={isUpdate ? undefined : 3}
        total={isUpdate ? undefined : 3}
        title={isUpdate ? (name ? `Update ${name}'s` : 'Update') : name ? 'Now scan' : 'Liveness'}
        accent={isUpdate ? 'face.' : (name ?? 'check')}
        instruction={
          isUpdate
            ? allowBackCamera
              ? 'A new liveness check replaces the current face. You can hold the phone and use the back camera.'
              : 'A new liveness check on the front camera replaces the current face.'
            : allowBackCamera
              ? 'A short liveness check. You can hold the phone and use the back camera.'
              : 'A short liveness check on the front camera.'
        }
        footer={
          <Button label={isUpdate ? 'Start face update' : 'Start face verification'} icon={ScanFace} onPress={() => setStarted(true)} />
        }>
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
          {(isUpdate ? UPDATE_CHECKLIST : CHECKLIST).map((c) => (
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
      mode={isUpdate ? 'update' : 'enroll'}
      personId={personId}
      allowBackCamera={allowBackCamera}
      onSuccess={isUpdate ? backToMember : goToMemberDetail}
    />
  );
}
