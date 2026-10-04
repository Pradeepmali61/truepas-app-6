/** @jsxImportSource react */
/**
 * Status bar tone for dark-topped screens (navy heroes, photo headers, the
 * dark capture stages). The app default is dark icons on the light canvas;
 * a screen whose top is dark asks for light icons while it is focused.
 *
 * Why a shared counter instead of calling setStatusBarStyle on focus/blur:
 * when screen B is pushed over A, B's focus effect can run BEFORE A's blur
 * cleanup, so "light on focus / dark on blur" can end on the wrong tone.
 * Counting open requests makes the order irrelevant, and the single
 * <AppStatusBar /> in the root layout renders the result — so the RN
 * StatusBar props stack (FaceStudio's own <StatusBar style="light" />)
 * restores to the right tone when a nested bar unmounts.
 */
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState, useSyncExternalStore } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

let lightRequests = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};
const isLight = () => lightRequests > 0;

/** The app's one status bar — render once, in the root layout. */
export function AppStatusBar() {
  const light = useSyncExternalStore(subscribe, isLight, isLight);
  return <StatusBar style={light ? 'light' : 'dark'} />;
}

/** Light status bar icons while the calling screen is focused (and
 *  `enabled`). Restores the dark default on blur/unmount. */
export function useLightStatusBar(enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      lightRequests += 1;
      emit();
      return () => {
        lightRequests -= 1;
        emit();
      };
    }, [enabled]),
  );
}

/**
 * useLightStatusBar for a scrolling screen with a dark hero: light icons
 * while the hero is under the status bar, dark once the light canvas has
 * scrolled up behind it. `darkBottom` = where the dark area ends, in scroll
 * content coordinates. Spread the result onto the ScrollView.
 */
export function useHeroStatusBar(darkBottom: number, enabled = true) {
  const insets = useSafeAreaInsets();
  const [pastHero, setPastHero] = useState(false);
  useLightStatusBar(enabled && !pastHero);
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const past = e.nativeEvent.contentOffset.y + insets.top > darkBottom;
      setPastHero((p) => (p === past ? p : past));
    },
    [darkBottom, insets.top],
  );
  return { onScroll, scrollEventThrottle: 32 } as const;
}
