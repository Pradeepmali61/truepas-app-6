/** @jsxImportSource react */
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { loadLivenessCamera } from '@/features/liveness/cameraModule';
import { CameraUnavailableView } from '@/premium/flows/face';
import { CameraPermissionGate } from '@/premium/flows/faceCamera';
import { flowGuards } from '@/services/flowGuards';

/** Update face — liveness challenge + face update via BFF (PUT /face).
 *  Only reachable after the PIN screen verified the account PIN — a deep link
 *  here is bounced back to the PIN gate. `personId` (when present) targets a
 *  family member's face instead of the authenticated main user's. */
const LivenessCamera = loadLivenessCamera();

export default function FaceUpdateCameraScreen() {
  const router = useRouter();
  const { personId, age } = useLocalSearchParams<{ personId?: string; age?: string }>();
  const [pinVerified] = useState(() => flowGuards.has('face-update:camera'));

  // Consume on mount — the PIN gate can't be replayed by re-entering.
  useEffect(() => {
    if (pinVerified) flowGuards.consume('face-update:camera');
  }, [pinVerified]);
  // Under-10 family members may use the rear camera here too.
  const ageNum = age != null ? Number(age) : NaN;
  const allowBackCamera = Number.isFinite(ageNum) && ageNum < 10;

  if (!pinVerified) {
    return (
      <Redirect
        href={{
          pathname: '/face-update/pin',
          params: personId ? { personId, ...(age ? { age } : {}) } : {},
        }}
      />
    );
  }
  if (!LivenessCamera) return <CameraUnavailableView />;

  return (
    <CameraPermissionGate topTitle="Update face">
      <LivenessCamera
        mode="update"
        personId={personId}
        allowBackCamera={allowBackCamera}
        onSuccess={() => {
          flowGuards.grant('face-update:done');
          router.replace('/face-update/success');
        }}
      />
    </CameraPermissionGate>
  );
}
