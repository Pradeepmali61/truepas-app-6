/** @jsxImportSource react */
/**
 * TRUEPAS PREMIUM — face onboarding + face re-enrolment flow pieces.
 *
 * - FaceStudio: the dark biometric "studio" shell (FaceScanView look) with
 *   free content, so real screens can render real data instead of the
 *   showcase photo/checks baked into views.tsx FaceScanView.
 * - CameraUnavailableView: premium twin of liveness/cameraModule's
 *   <CameraUnavailable/> (same copy + Go back).
 * - Premium liveness stages (PremiumChallengeStage / PremiumFinishingStage /
 *   PremiumLivenessResultStage) — drop-in replacements for the exports of
 *   features/liveness/LivenessStages.tsx, typed against the SAME prop
 *   interfaces. LivenessCamera (shared logic, not editable here) still
 *   imports the old stages; swapping its import line to these adopts the
 *   premium look with zero logic changes. They keep the camera contract:
 *   the challenge stage renders the live `camera` INSIDE the FaceRing, the
 *   finishing/result stages park `cameraSlot` off-screen at -2000
 *   (capturePhotoToFile + the Fabric unmount-crash workaround need it).
 *
 * No camera imports here — safe on web / Expo Go.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Check,
  CameraOff,
  Glasses,
  ListChecks,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  Sun,
  SwitchCamera,
  Timer,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ChallengeStageProps, LivenessResultStageProps } from '@/features/liveness/LivenessStages';
import { FaceRing, Medallion } from '@/premium/blocks';
import { ConfirmSheet } from '@/premium/kit';
import { C, F, G, R } from '@/premium/theme';
import { Badge, Button, Footer, Group, Heading, IconCircle, ListRow, Row, Steps, TopBar, Txt } from '@/premium/ui';
import { ResultView } from '@/premium/views';

/* ───────────────────────── copy ───────────────────────── */

/** Face-scan intro tips (original face-scan POINTS). */
export const INTRO_TIPS: { icon: LucideIcon; title: string }[] = [
  { icon: ListChecks, title: 'Follow the on-screen prompts' },
  { icon: Sun, title: 'Hold still in good light' },
  { icon: Timer, title: 'The session expires after a few minutes' },
];

/** Retry tips (original static intro: good lighting · no glasses/mask · eye-level camera). */
export const RETRY_TIPS: { icon: LucideIcon; title: string; sub?: string }[] = [
  { icon: Sun, title: 'Find even light', sub: 'Avoid bright light behind you' },
  { icon: Glasses, title: 'Remove sunglasses or mask' },
  { icon: UserRound, title: 'Hold the phone at eye level' },
];

/** Truthful privacy line — matches the privacy policy ("encrypted face
 *  template stored in a dedicated face gallery"). Never "on-device only" /
 *  "never a photo": a frame IS uploaded at liveness finalize. */
export const PRIVACY_LINE = 'Stored as an encrypted face template';

/* ───────────────────────── dark studio shell ───────────────────────── */

const WHITE_60 = 'rgba(255,255,255,0.6)';
const WHITE_80 = 'rgba(255,255,255,0.82)';

export function FaceStudio({
  topTitle = 'Face verification',
  onBack,
  hideBack,
  step,
  total,
  right,
  rail,
  children,
  footer,
  offscreen,
}: {
  topTitle?: string;
  onBack?: () => void;
  hideBack?: boolean;
  /** Static flow position (e.g. 2 of 3) — renders the counter + segmented bar. */
  step?: number;
  total?: number;
  right?: ReactNode;
  /** Custom progress rail under the top bar (overrides step/total bar). */
  rail?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Rendered at the root, outside the scroll view (off-screen camera). */
  offscreen?: ReactNode;
}) {
  const hasSteps = step != null && total != null;
  return (
    <View style={{ flex: 1, backgroundColor: C.navyNight }}>
      <StatusBar style="light" />
      <LinearGradient colors={G.night} style={StyleSheet.absoluteFill} />
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <TopBar
          tone="glass"
          title={topTitle}
          onBack={onBack}
          hideBack={hideBack}
          right={
            right ??
            (hasSteps ? (
              <Txt v="smallStrong" color={WHITE_60}>
                {step}/{total}
              </Txt>
            ) : undefined)
          }
        />
        {rail != null ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>{rail}</View>
        ) : hasSteps ? (
          <View style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            <Steps total={total} current={step - 1} light />
          </View>
        ) : null}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12, gap: 22 }}
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
        {footer != null && <Footer>{footer}</Footer>}
      </SafeAreaView>
      {offscreen}
    </View>
  );
}

/** Dark glass list of tips (icon + line). */
export function StudioTips({ items }: { items: { icon: LucideIcon; title: string }[] }) {
  return (
    <View
      style={{
        borderRadius: R.xl,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 4,
      }}>
      {items.map((t, i) => {
        const Icon = t.icon;
        return (
          <View
            key={t.title}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 12,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: 'rgba(255,255,255,0.08)',
            }}>
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: 'rgba(8,182,252,0.18)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Icon size={17} color={C.skyLight} strokeWidth={2.2} />
            </View>
            <Txt v="body" color={WHITE_80} style={{ flex: 1 }}>
              {t.title}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}

export function PrivacyNote({ dark }: { dark?: boolean }) {
  const color = dark ? 'rgba(255,255,255,0.5)' : C.ink3;
  return (
    <Row gap={8} style={{ justifyContent: 'center', paddingBottom: 4 }}>
      <ShieldCheck size={15} color={color} />
      <Txt v="small" color={color}>
        {PRIVACY_LINE}
      </Txt>
    </Row>
  );
}

/* ───────────────────────── camera unavailable ───────────────────────── */

/** Premium twin of cameraModule's <CameraUnavailable/> — the build lacks
 *  the NitroModules camera stack (Expo Go / stale dev client). */
export function CameraUnavailableView() {
  const router = useRouter();
  return (
    <ResultView
      icon={CameraOff}
      tone="red"
      over="Face verification"
      title="Camera"
      accent="unavailable."
      sub="This build doesn't include the camera module. Rebuild the dev client (npx expo run:android or an EAS development build) and try again."
      primary={<Button label="Go back" tone="white" onPress={() => router.back()} />}
    />
  );
}

/* ───────────────────────── liveness stages (ready to wire) ───────────────────────── */

/** Camera parked outside the viewport — photo output stays alive while the
 *  finishing/result screens show (capturePhotoToFile needs a live camera). */
function OffscreenCamera({ camera }: { camera?: ReactNode }) {
  if (!camera) return null;
  return <View style={{ position: 'absolute', top: -2000, left: -2000, width: 400, height: 533 }}>{camera}</View>;
}

/** Segmented rail: completed steps solid, the active one sweeps 0→100%
 *  over the server's step time (the `stepProgress` animation). */
function LiveRail({ total, index, progress }: { total: number; index: number; progress: Animated.Value }) {
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {Array.from({ length: Math.max(total, 1) }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            overflow: 'hidden',
            backgroundColor: i < index ? C.sky : 'rgba(255,255,255,0.2)',
          }}>
          {i === index && (
            <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width, backgroundColor: C.sky }} />
          )}
        </View>
      ))}
    </View>
  );
}

function StepChip({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 36,
        paddingHorizontal: 14,
        borderRadius: R.full,
        backgroundColor: done ? 'rgba(18,183,106,0.16)' : active ? 'rgba(8,182,252,0.18)' : 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: done ? 'rgba(18,183,106,0.4)' : active ? 'rgba(8,182,252,0.6)' : 'rgba(255,255,255,0.1)',
      }}>
      {done ? (
        <Check size={14} color="#4ADE9B" strokeWidth={3} />
      ) : (
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: active ? C.sky : 'rgba(255,255,255,0.3)' }} />
      )}
      <Text
        style={{
          fontFamily: F.semibold,
          fontSize: 13,
          color: done ? '#4ADE9B' : active ? C.white : 'rgba(255,255,255,0.5)',
        }}>
        {label}
      </Text>
    </View>
  );
}

/** Drop-in for LivenessStages `ChallengeStage` — live camera inside the FaceRing. */
export function PremiumChallengeStage({
  instruction,
  steps,
  stepIndex,
  labels,
  stepProgress,
  expiresIn,
  sessionExpiring,
  multiFace,
  hint,
  camera,
  allowBackCamera,
  cameraPosition,
  onSwitchCamera,
  onRestart,
}: ChallengeStageProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const [confirming, setConfirming] = useState(false);
  const ring = Math.round(Math.max(180, Math.min(262, width - 100, height * 0.34)));
  const total = steps.length;
  // Server ui_copy label, else the action id humanised ("turn_left" → "Turn left").
  const label = (c: string) => labels[c] ?? c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ');

  return (
    <>
      <FaceStudio
        onBack={() => setConfirming(true)}
        rail={total > 0 ? <LiveRail total={total} index={stepIndex} progress={stepProgress} /> : undefined}
        right={
          allowBackCamera ? (
            <IconCircle
              icon={SwitchCamera}
              tone="glass"
              label={cameraPosition === 'front' ? 'Switch to back camera' : 'Switch to front camera'}
              onPress={onSwitchCamera}
            />
          ) : total > 0 ? (
            <Txt v="smallStrong" color={WHITE_60}>
              {Math.min(stepIndex + 1, total)}/{total}
            </Txt>
          ) : undefined
        }
        footer={
          <Row gap={10}>
            <Button label="Restart scan" tone="glass" icon={RotateCcw} size="md" style={{ flex: 1 }} onPress={onRestart} />
            <Button label="Cancel" tone="glass" size="md" style={{ flex: 1 }} onPress={() => setConfirming(true)} />
          </Row>
        }>
        <Heading light center title="Verify your" accent="face" sub={instruction} />
        <View style={{ alignItems: 'center' }}>
          <FaceRing dark size={ring} mode="scan" progress={total > 0 ? Math.max(0.04, stepIndex / total) : 0.04}>
            {camera}
          </FaceRing>
        </View>
        {total > 0 && (
          <Row gap={8} style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {steps.map((c, i) => (
              <StepChip key={`${c}-${i}`} label={label(c)} done={i < stepIndex} active={i === stepIndex} />
            ))}
          </Row>
        )}
        {multiFace ? (
          <Txt v="smallStrong" color="#FF8A80" center>
            Only one person in the frame
          </Txt>
        ) : hint ? (
          <Txt v="small" color={WHITE_60} center>
            {hint}
          </Txt>
        ) : expiresIn != null ? (
          <Txt v="mono" color={sessionExpiring ? '#FF8A80' : 'rgba(255,255,255,0.5)'} center>
            Session expires in {Math.floor(expiresIn / 60)}:{String(expiresIn % 60).padStart(2, '0')}
          </Txt>
        ) : null}
      </FaceStudio>
      {/* Cancel discards the in-flight session — confirm before leaving. */}
      <ConfirmSheet
        visible={confirming}
        danger
        title="Discard session?"
        body="The current verification session will be discarded."
        confirmLabel="Discard"
        cancelLabel="Keep scanning"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          router.back();
        }}
      />
    </>
  );
}

/** Drop-in for LivenessStages `FinishingStage` — camera stays mounted off-screen. */
export function PremiumFinishingStage({ cameraSlot }: { cameraSlot?: ReactNode }) {
  return (
    <FaceStudio hideBack offscreen={<OffscreenCamera camera={cameraSlot} />}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 22 }}>
        <FaceRing dark size={200} mode="scan" photo={false} progress={1} />
        <Heading light center title="Verifying" accent="liveness…" sub="Running anti-spoof checks. Don't close the app." />
        <ActivityIndicator size="large" color={C.sky} accessibilityLabel="Verifying" />
      </View>
    </FaceStudio>
  );
}

/** Drop-in for LivenessStages `LivenessResultStage` (passed / failed). */
export function PremiumLivenessResultStage({
  outcome,
  personId,
  score,
  error,
  primaryLabel,
  primaryLoading,
  primaryDisabled,
  onPrimary,
  onBack,
  cameraSlot,
}: LivenessResultStageProps) {
  const passed = outcome === 'passed';
  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <TopBar hideBack />
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24, gap: 24 }}
          showsVerticalScrollIndicator={false}>
          <View style={{ alignItems: 'center' }}>
            <Medallion icon={passed ? Check : ScanFace} tone={passed ? 'green' : 'amber'} size={88} />
          </View>
          {passed ? (
            <Heading
              over="Liveness confirmed"
              title="You're"
              accent="verified."
              center
              sub={
                personId
                  ? 'Face enrollment is complete — they can check in with you.'
                  : 'Your face is enrolled. Check in at venues with a glance — no documents needed.'
              }
            />
          ) : (
            <Heading
              over="Let's try that again"
              title="We couldn't verify"
              accent="liveness."
              center
              sub="Move to a brighter spot and keep the face inside the ring for the whole step."
            />
          )}
          {error ? (
            <Txt v="small" center>
              {error}
            </Txt>
          ) : null}
          {__DEV__ && score != null && (
            <View style={{ alignItems: 'center' }}>
              <Badge label={`Anti-spoof score · ${score.toFixed(2)}`} tone="neutral" />
            </View>
          )}
          {!passed && (
            <Group title="Quick tips">
              {RETRY_TIPS.map((t) => (
                <ListRow key={t.title} icon={t.icon} tone="amber" title={t.title} sub={t.sub} chevron={false} />
              ))}
            </Group>
          )}
        </ScrollView>
        <Footer>
          <Button
            label={primaryLabel}
            icon={passed ? undefined : RotateCcw}
            loading={primaryLoading}
            disabled={primaryDisabled}
            onPress={onPrimary}
          />
          <Button label="Back to start" tone="ghost" onPress={onBack} />
        </Footer>
      </SafeAreaView>
      <OffscreenCamera camera={cameraSlot} />
    </View>
  );
}
