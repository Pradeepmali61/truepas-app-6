/** @jsxImportSource react */
/**
 * Add family — photo enrollment for under-5 members (POST /cb/face/enroll),
 * premium skin. Behaviour is a 1:1 port of features/liveness/PhotoCapture:
 * under-5 members can't run liveness — one clear photo is sent as
 * { selfieBase64, personId } instead of liveness session credentials; either
 * camera may be used (a parent holds the phone for the rear camera).
 *
 * Statically imports react-native-vision-camera — NEVER import this file from
 * a route. Load it through loadFamilyPhotoCapture() (./family), which falls
 * back to <CameraUnavailableView /> on builds without NitroModules.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Baby, Camera as CameraIcon, SwitchCamera } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput, type CameraRef } from 'react-native-vision-camera';

import { toApiError } from '@/api/errors';
import { useEnrollFace } from '@/features/auth/mutations';

import { FaceRing } from '../blocks';
import { Banner } from '../kit';
import { C } from '../theme';
import { Button, IconCircle, Row } from '../ui';
import { GlassPill, NightStage } from './family';

export function FamilyPhotoCapture() {
  const router = useRouter();
  const { name, age, personId } = useLocalSearchParams<{ name?: string; age?: string; personId?: string }>();

  const { hasPermission, requestPermission } = useCameraPermission();
  // Under-5 photo enrollment allows either camera — a parent can hold the
  // phone and capture the child with the rear camera.
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('front');
  const device = useCameraDevice(cameraPosition);
  const photoOutput = usePhotoOutput();
  const cameraRef = useRef<CameraRef>(null);
  const enrollFace = useEnrollFace();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Stop the preview and let the native camera settle before leaving —
  // unmounting an ACTIVE Camera on Fabric crashes (see LivenessCamera
  // settleCameraThen).
  const [cameraActive, setCameraActive] = useState(true);
  const settleCameraThen = async (navigate: () => void) => {
    setCameraActive(false);
    await new Promise((resolve) => setTimeout(resolve, 400));
    navigate();
  };

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const goToMemberDetail = () => {
    if (personId) {
      router.replace({ pathname: '/family/[id]', params: { id: personId } });
    } else {
      router.dismissTo('/(tabs)');
    }
  };

  const capture = async () => {
    if (capturing) return;
    if (!personId) {
      setError('Missing family member reference. Please go back and try again.');
      return;
    }
    setCapturing(true);
    setError(null);
    try {
      const photoFile = await photoOutput.capturePhotoToFile({ flashMode: 'off' }, {});
      if (!photoFile) throw new Error('Failed to capture photo');
      const { File } = await import('expo-file-system');
      const filePath = photoFile.filePath.startsWith('file://') ? photoFile.filePath : `file://${photoFile.filePath}`;
      const selfieBase64 = await new File(filePath).base64();
      await enrollFace.mutateAsync({ selfieBase64, personId });
      await settleCameraThen(goToMemberDetail);
    } catch (err) {
      setError(toApiError(err).message || 'Could not enroll the photo. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const stage = {
    topTitle: 'Face enrollment',
    subtitle: age ? `Age ${age} · photo enrollment` : 'Photo enrollment',
    onBack: () => void settleCameraThen(router.back),
    step: 3,
    total: 3,
    right: (
      <IconCircle
        icon={SwitchCamera}
        tone="glass"
        label={cameraPosition === 'front' ? 'Switch to back camera' : 'Switch to front camera'}
        onPress={() => setCameraPosition((p) => (p === 'front' ? 'back' : 'front'))}
      />
    ),
  };

  if (!hasPermission) {
    return (
      <NightStage
        {...stage}
        title="Camera"
        accent="access"
        instruction="Camera permission is required to take the enrollment photo."
        footer={<Button label="Grant permission" onPress={requestPermission} />}
      />
    );
  }

  if (!device) {
    return (
      <NightStage {...stage} title="Loading" accent="camera…">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 }} accessibilityRole="progressbar" accessibilityLabel="Loading camera">
          <ActivityIndicator size="large" color={C.sky} />
        </View>
      </NightStage>
    );
  }

  return (
    <NightStage
      {...stage}
      title={name ? `${name}'s` : 'Face'}
      accent="photo."
      instruction="Members under 5 enroll with one clear photo — no liveness check needed."
      footer={
        <Button
          label="Capture photo"
          icon={CameraIcon}
          loading={capturing}
          disabled={capturing}
          onPress={() => void capture()}
        />
      }>
      <View style={{ alignItems: 'center' }}>
        <FaceRing dark size={250} mode={capturing ? 'scan' : 'idle'} progress={0.5}>
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={cameraActive}
            outputs={[photoOutput]}
            mirrorMode="auto"
            resizeMode="cover"
            implementationMode="compatible"
          />
        </FaceRing>
      </View>
      <Row gap={8} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <GlassPill icon={Baby} label="Under 5 · photo" />
        <GlassPill label={cameraPosition === 'front' ? 'Front camera' : 'Back camera'} active />
      </Row>
      {error ? <Banner tone="error" title="Photo enrollment failed" body={error} /> : null}
    </NightStage>
  );
}
