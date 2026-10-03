/** @jsxImportSource react */
/**
 * Security hub — sign-in credentials, biometric consent, danger zone.
 * Sensitive flows (password/PIN change) route through the confirm-pin gate
 * first; face update has its own PIN step (/face-update/pin). Biometric
 * withdrawal deletes face templates server-side and sets faceEnrolled=false,
 * forcing re-enrollment.
 *
 * Mockup-only pieces with no backend (security score, 2-step sign-in,
 * signed-in devices) stay visible as Coming soon.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Fingerprint, KeyRound, Lock, ScanFace, ShieldCheck, Smartphone, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { isMockApi } from '@/api';
import { toApiError } from '@/api/errors';
import { MOCK_PIN } from '@/api/mock';
import { useBiometricConsent } from '@/features/auth/mutations';
import { biometricConsentGiven, biometricConsentRevoked } from '@/features/auth/slice';
import { useToast } from '@/hooks/useToast';
import { Guilloche } from '@/premium/blocks';
import { SoonRow, SoonSection } from '@/premium/flows/account';
import { ConfirmSheet, SoonOverlay } from '@/premium/kit';
import { C, F, G, R, SH } from '@/premium/theme';
import { Group, ListRow, Row, Screen, Toggle, TopBar, Txt } from '@/premium/ui';
import { useAppDispatch, useAppSelector } from '@/store';

export default function SecurityScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const toast = useToast();
  const consent = useBiometricConsent();
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  // Server truth — reflects the stored user record, not local optimism.
  const consentOn = !!user?.biometricConsentAt;

  const applyConsent = async (accepted: boolean) => {
    if (consent.isPending) return;
    try {
      await consent.mutateAsync({ accepted });
      dispatch(accepted ? biometricConsentGiven() : biometricConsentRevoked());
      // Withdrawing drops faceEnrolled locally too — the tabs layout routes
      // the user back through consent + re-enrollment on next entry.
      toast.show(
        'success',
        accepted ? 'Biometric consent on' : 'Biometric consent off — your enrolled face was removed.',
      );
    } catch (err) {
      toast.show('error', toApiError(err).message || 'Could not update consent. Please try again.');
    }
  };

  const onConsentToggle = (next: boolean) => {
    if (next) void applyConsent(true);
    else setConfirmRevoke(true);
  };

  const gate = (next: string) => () =>
    router.push({ pathname: '/security/confirm-pin', params: { next } } as never);

  return (
    <Screen header={<TopBar title="Security" />} contentStyle={{ paddingTop: 4 }}>
      <SoonOverlay light>
        <ScoreHero />
      </SoonOverlay>

      <Group title="Sign-in">
        <ListRow icon={Lock} tone="sky" title="Change password" sub="Update your account password" onPress={gate('/security/change-password')} />
        <ListRow icon={KeyRound} tone="sky" title="Change PIN" sub="4-digit code for sensitive actions" onPress={gate('/security/change-pin')} />
        <ListRow icon={ScanFace} tone="sky" title="Update face" sub="Re-enroll your face template" onPress={() => router.push('/face-update/pin')} />
        <SoonRow icon={ShieldCheck} tone="sky" title="2-step sign-in" sub="Extra check when you sign in" />
      </Group>

      <Group title="Face & consent">
        <ListRow
          icon={Fingerprint}
          tone="sky"
          title="Biometric consent"
          sub={consentOn ? 'On — your face template is stored' : 'Off — no face template stored'}
          chevron={false}
          trailing={
            <Toggle on={consentOn} onChange={onConsentToggle} disabled={consent.isPending} label="Biometric consent" />
          }
        />
      </Group>

      <SoonSection title="Signed-in devices">
        <ListRow icon={Smartphone} title="This device" sub="See and sign out other sessions" chevron={false} />
      </SoonSection>

      <Group title="Danger zone">
        <ListRow icon={Trash2} danger title="Delete account" sub="Erase your data permanently" onPress={() => router.push('/account/delete')} />
      </Group>

      {__DEV__ && isMockApi() && (
        <Txt v="small" color={C.ink4} center>
          Demo PIN: {MOCK_PIN}
        </Txt>
      )}

      <ConfirmSheet
        visible={confirmRevoke}
        danger
        icon={Fingerprint}
        title="Turn off biometric consent?"
        body="Turning this off removes your enrolled face. You'll need to re-enroll before using face check-in again."
        confirmLabel="Turn off"
        loading={consent.isPending}
        onCancel={() => setConfirmRevoke(false)}
        onConfirm={() => {
          setConfirmRevoke(false);
          void applyConsent(false);
        }}
      />
    </Screen>
  );
}

/** Mockup security-score hero — no score API yet, so it renders without a number. */
function ScoreHero() {
  const size = 96;
  const r = 40;
  return (
    <View style={[{ borderRadius: R.xl, overflow: 'hidden', padding: 22 }, SH.navy]}>
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Guilloche size={360} style={{ right: -180, bottom: -200 }} />
      <Row gap={20}>
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.14)" strokeWidth={8} fill="none" />
          </Svg>
          <ShieldCheck size={30} color={C.skyLight} />
        </View>
        <View style={{ flex: 1, gap: 6, paddingTop: 22 }}>
          <Text style={{ fontFamily: F.bold, fontSize: 19, letterSpacing: -0.4, color: C.white }}>Security score</Text>
          <Text style={{ fontFamily: F.medium, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            A quick health check of your sign-in settings.
          </Text>
        </View>
      </Row>
    </View>
  );
}
