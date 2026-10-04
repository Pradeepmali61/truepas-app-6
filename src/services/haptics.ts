/**
 * Haptic feedback that respects Settings → Haptics. Use these instead of
 * calling expo-haptics directly. Failures (web, no vibrator) are ignored.
 */
import * as Haptics from 'expo-haptics';

import { getPrefs } from '@/services/prefs';

const on = () => getPrefs().haptics;

export function tapHaptic() {
  if (on()) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function selectHaptic() {
  if (on()) Haptics.selectionAsync().catch(() => {});
}

export function successHaptic() {
  if (on()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

export function errorHaptic() {
  if (on()) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
}
