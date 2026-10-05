/**
 * The `device` object the BFF stores with each session (login, refresh,
 * registration OTP, 2-step verify, face sign-in) — it labels the row in
 * Security → "Signed-in devices". Best effort: never throws.
 */
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import type { DeviceInfo } from '@/types/domain';

export function deviceInfo(): DeviceInfo {
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web';
  let name: string | null = null;
  try {
    name = Device.modelName ?? Device.deviceName ?? null;
  } catch {
    name = null;
  }
  return {
    name: name ?? (platform === 'web' ? 'Web browser' : 'Phone'),
    platform,
    appVersion: Constants.expoConfig?.version ?? '1.0.0',
  };
}
