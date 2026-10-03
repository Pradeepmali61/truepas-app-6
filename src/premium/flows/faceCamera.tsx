/** @jsxImportSource react */
/**
 * Premium camera-permission gate for the liveness routes.
 *
 * LivenessCamera (shared logic) renders its own old-kit permission screen
 * while `useCameraPermission().hasPermission` is false. Mounting it behind
 * this gate means it only ever mounts with permission already granted, so
 * the permission step shows the premium studio instead — with the SAME
 * behaviour: request on mount, a grant button, and an Open Settings button
 * once a request comes back denied (permanently denied → the system dialog
 * won't show again).
 *
 * Only import from routes that already load the liveness camera
 * (loadLivenessCamera): react-native-vision-camera is required lazily and
 * guarded, so builds without NitroModules fall back to a pass-through and
 * the route's <CameraUnavailableView/> branch handles them.
 */
import { Camera, Settings } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Linking, View } from 'react-native';

import { FaceRing } from '@/premium/blocks';
import { FaceStudio, PrivacyNote } from '@/premium/flows/face';
import { Button, Heading, Txt } from '@/premium/ui';

interface CameraPermission {
  hasPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

/** No camera module → nothing to gate; LivenessCamera can't load either. */
function usePassThroughPermission(): CameraPermission {
  return { hasPermission: true, requestPermission: async () => true };
}

function loadPermissionHook(): () => CameraPermission {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy: throws without NitroModules
    const mod = require('react-native-vision-camera') as { useCameraPermission?: () => CameraPermission };
    return mod.useCameraPermission ?? usePassThroughPermission;
  } catch {
    return usePassThroughPermission;
  }
}

/** Resolved once at module load — a stable hook identity for every render. */
const useCameraPermission = loadPermissionHook();

export function CameraPermissionGate({ children, topTitle }: { children: ReactNode; topTitle?: string }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  // True once requestPermission() comes back denied — shows Open Settings.
  const [permDenied, setPermDenied] = useState(false);

  // Request on mount (same as LivenessCamera).
  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  if (hasPermission) return <>{children}</>;

  const grant = async () => {
    const granted = await requestPermission();
    // Permanently denied → the dialog won't show again; offer Settings.
    if (!granted) setPermDenied(true);
  };

  return (
    <FaceStudio
      topTitle={topTitle}
      footer={
        <>
          <Button label="Allow camera" icon={Camera} onPress={() => void grant()} />
          {permDenied && (
            <Button label="Open Settings" tone="glass" icon={Settings} onPress={() => void Linking.openSettings()} />
          )}
          <PrivacyNote dark />
        </>
      }>
      <View style={{ flex: 1, justifyContent: 'center', gap: 26 }}>
        <View style={{ alignItems: 'center' }}>
          <FaceRing dark size={190} mode="idle" photo={false} />
        </View>
        <Heading
          light
          center
          title="Allow"
          accent="camera access"
          sub="Camera permission is required for face verification."
        />
        {permDenied && (
          <Txt v="small" color="rgba(255,255,255,0.6)" center>
            If the prompt doesn&apos;t appear, turn on camera access for Truepas in Settings, then come back.
          </Txt>
        )}
      </View>
    </FaceStudio>
  );
}
