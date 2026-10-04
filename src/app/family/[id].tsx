/** @jsxImportSource react */
/**
 * FamilyDetailScreen — a single family member. Hero, setup checklist derived
 * from verification state, the member's documents and the remove flow.
 * "Continue setup" routes to our real next step (document capture, then
 * photo/liveness capture). Once set up, "Update face" re-runs the member's
 * capture (PIN first) and "Add a document" adds extra documents without
 * repeating the face step. Premium skin over the original (0483c76) behaviour.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  BadgeCheck,
  BellRing,
  CalendarDays,
  Camera,
  FilePlus,
  FileText,
  History,
  Image as ImageIcon,
  ScanFace,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react-native';
import { useCallback, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useToast } from '@/components/composite/Toast';
import { documentKeys, useDocuments } from '@/features/documents/hooks';
import { familyKeys, useFamilyMember, useMemberPhoto, useRemoveFamilyMember, useSetMemberPhoto } from '@/features/family/hooks';
import { Glow, Guilloche } from '@/premium/blocks';
import { ChecklistCard, DocRow, formatDate, statusBadge, type ChecklistStep } from '@/premium/flows/family';
import { Async, Bone, ConfirmSheet, EmptyView, SkeletonList, SoonOverlay } from '@/premium/kit';
import { useHeroStatusBar } from '@/premium/statusBar';
import { C, F, SH } from '@/premium/theme';
import { Badge, Button, Group, initials, ListRow, Screen, Toggle, TopBar, Txt, VerifiedTick } from '@/premium/ui';
import type { FamilyMember } from '@/types/domain';

function stepsFor(m: FamilyMember, docDone: boolean): ChecklistStep[] {
  const isPhoto = m.faceCaptureMode === 'photo';
  const faceDone = isFaceDone(m);
  return [
    {
      icon: FileText,
      label: 'Document',
      sub: 'Birth certificate, passport, or ID',
      done: docDone,
    },
    {
      icon: isPhoto ? Camera : ScanFace,
      label: isPhoto ? 'Face photo' : 'Liveness check',
      sub: isPhoto ? 'One clear photo — no liveness under 5' : 'Short challenge prompts on the front camera',
      done: faceDone,
    },
    {
      icon: BadgeCheck,
      label: 'Enrolled',
      sub: 'Ready for venue check-in',
      done: docDone && faceDone,
    },
  ];
}

/** The backend never moves a member's `verification` to 'verified' after
 *  face enrollment — it only flips `faceEnrolled`. Gating on 'verified'
 *  alone left "Continue setup" showing forever after a successful scan. */
function isFaceDone(m: FamilyMember): boolean {
  return m.faceEnrolled || m.verification === 'verified';
}

export default function FamilyMemberScreen() {
  const router = useRouter();
  const { toast } = useToast();
  const { id, photo } = useLocalSearchParams<{ id: string; photo?: string }>();

  const member = useFamilyMember(id);
  const memberDocs = useDocuments(id);
  const removeMember = useRemoveFamilyMember();
  const [confirmRemove, setConfirmRemove] = useState(false);

  const m = member.data;
  // Navy hero: light status bar icons until the canvas scrolls under them
  // (the hero fades into the canvas from about two-thirds down).
  const heroStatusBar = useHeroStatusBar(230, !!m);

  // Coming back from a capture/document flow (which pops back to this
  // screen): refresh the member and their documents. Skips the first focus —
  // the queries already load on mount.
  const queryClient = useQueryClient();
  const seenFocus = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!seenFocus.current) {
        seenFocus.current = true;
        return;
      }
      void queryClient.invalidateQueries({ queryKey: familyKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: documentKeys.member(id) });
    }, [queryClient, id]),
  );
  const photoUri = useMemberPhoto(id);
  const setPhoto = useSetMemberPhoto(id);
  // Opened from the Family "Add photos" nudge: start on the source sheet.
  const [photoSheet, setPhotoSheet] = useState(photo === '1');
  const choosePhoto = async (source: 'camera' | 'library') => {
    setPhotoSheet(false);
    const r = await setPhoto.pick(source);
    if (r === 'saved') toast({ variant: 'success', title: 'Photo added' });
    else if (r === 'denied')
      toast({ variant: 'error', title: source === 'camera' ? 'Camera access is needed' : 'Photo access is needed' });
    else if (r === 'failed') toast({ variant: 'error', title: "Couldn't add the photo" });
  };
  const first = m?.name.split(' ')[0] ?? '';
  const isPhoto = (m?.faceCaptureMode ?? (m && m.age < 5 ? 'photo' : 'liveness')) === 'photo';
  // Member docs may stay 'pending' when backend verification isn't run for
  // them — any captured (non-failed) document completes this step.
  const doneDoc = memberDocs.data?.find((d) => d.status !== 'failed' && d.status !== 'missing');
  const docDone = doneDoc != null || m?.verification === 'pending_liveness' || m?.verification === 'verified';
  const setupDone = !!m && docDone && isFaceDone(m);

  const continueSetup = m
    ? !docDone
      ? () =>
          router.push({
            pathname: '/document/select-type',
            params: { family: '1', personId: id, memberName: m.name, band: m.ageBand },
          } as never)
      : () =>
          router.push({
            pathname: isPhoto ? '/family/add/photo-capture' : '/family/add/face-capture',
            params: { personId: id, name: first, age: String(m.age) },
          } as never)
    : undefined;
  const continueLabel = !docDone
    ? `Add ${first}'s document`
    : isPhoto
      ? `Take ${first}'s face photo`
      : `Complete ${first}'s face scan`;

  // Extra documents any time — processing sees personId and returns here
  // without re-running face capture.
  const addDocument = () =>
    m &&
    router.push({
      pathname: '/document/select-type',
      params: { family: '1', personId: id, memberName: m.name, band: m.ageBand },
    } as never);

  // Redo an enrolled member's face: PIN first (as for your own face), then
  // their own capture — liveness 5+ (PUT /face with personId), one photo under
  // 5 (POST /face/enroll) — which pops back here.
  const updateFace = () =>
    m &&
    router.push({
      pathname: '/face-update/pin',
      params: { personId: id, name: first, age: String(m.age), capture: isPhoto ? 'photo' : 'liveness' },
    } as never);

  // "Go to Family" — reset to Tabs → Family so leftover add-flow screens
  // don't sit under the list. Header/hardware back stay plain router.back().
  const goToFamily = () => {
    if (router.canDismiss()) router.dismissAll();
    router.push('/family' as never);
  };

  const cameras =
    m && m.allowedCameras?.length
      ? `${m.allowedCameras.map((c) => c[0].toUpperCase() + c.slice(1)).join(' + ')} camera`
      : '';

  const doRemove = async () => {
    try {
      await removeMember.mutateAsync(id);
      setConfirmRemove(false);
      toast({ variant: 'success', title: 'Member removed' });
      router.back();
    } catch (e) {
      setConfirmRemove(false);
      toast({
        variant: 'error',
        title: "Couldn't remove member",
        description: e instanceof Error ? e.message : undefined,
      });
    }
  };

  const refreshing = member.isRefetching || memberDocs.isRefetching;
  const onRefresh = () => {
    void member.refetch();
    void memberDocs.refetch();
  };

  if (!m) {
    return (
      <Screen header={<TopBar title="Member" />} contentStyle={{ paddingTop: 4 }} refreshing={refreshing} onRefresh={onRefresh}>
        <Async
          q={member}
          skeleton={
            <View style={{ gap: 16, alignItems: 'center', paddingTop: 12 }}>
              <Bone w={120} h={120} r={60} />
              <Bone w="60%" h={28} />
              <Bone w="40%" />
              <SkeletonList rows={3} thumb={40} />
            </View>
          }>
          {() => null}
        </Async>
      </Screen>
    );
  }

  const status = setupDone ? { label: 'Verified', tone: 'green' as const } : statusBadge(m.verification);

  return (
    <View style={{ flex: 1, backgroundColor: C.canvas }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        {...heroStatusBar}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.sky} />}>
        {/* ---------- hero (members have no photo — monogram on the identity gradient) ---------- */}
        <View style={{ height: 340, overflow: 'hidden' }}>
          {/* Dark at the top (glass back button), lighter toward the fade so the
              hero melts into the canvas like the approved photo hero. */}
          <LinearGradient colors={[C.navyNight, C.navy, '#0A86B8']} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
          <Glow size={380} opacity={0.45} style={{ top: -150, right: -140 }} />
          <Guilloche size={520} style={{ alignSelf: 'center', top: -60 }} />
          <LinearGradient
            colors={['rgba(246,248,250,0)', 'rgba(246,248,250,0.7)', C.canvas]}
            locations={[0.5, 0.82, 1]}
            style={StyleSheet.absoluteFill}
          />
          <SafeAreaView edges={['top']}>
            <TopBar tone="glass" />
          </SafeAreaView>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 70 }}>
            <View
              style={{
                width: 128,
                height: 128,
                borderRadius: 64,
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 1.5,
                borderColor: 'rgba(255,255,255,0.3)',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={{ width: 128, height: 128 }} contentFit="cover" />
              ) : (
                <Text style={{ fontFamily: F.bold, fontSize: 44, letterSpacing: 1, color: C.white }}>{initials(m.name)}</Text>
              )}
            </View>
            <Pressable
              onPress={() => setPhotoSheet(true)}
              disabled={setPhoto.busy}
              accessibilityRole="button"
              accessibilityLabel={photoUri ? `Change ${first}'s photo` : `Add ${first}'s photo`}
              style={{ marginTop: -22, marginLeft: 92 }}>
              <View
                style={[
                  {
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: C.sky,
                    borderWidth: 3,
                    borderColor: C.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                  },
                  SH.sky,
                ]}>
                <Camera size={17} color={C.white} strokeWidth={2.4} />
              </View>
            </Pressable>
          </View>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: -44, gap: 26 }}>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text
                numberOfLines={2}
                style={{ flexShrink: 1, fontFamily: F.extrabold, fontSize: 34, lineHeight: 40, letterSpacing: -1.1, color: C.ink }}>
                {m.name}
              </Text>
              {setupDone && <VerifiedTick size={24} />}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Badge label={`${m.relationship} · ${m.age} yrs`} tone="neutral" />
              <Badge label={status.label} tone={status.tone} dot />
              <Badge label={m.faceCaptureMode === 'photo' ? 'Photo' : 'Liveness'} tone="sky" icon={m.faceCaptureMode === 'photo' ? Camera : ScanFace} />
              {cameras ? <Badge label={cameras} tone="neutral" /> : null}
            </View>
          </View>

          {!setupDone && continueSetup && (
            <Button label={continueLabel} icon={!docDone ? FileText : isPhoto ? Camera : ScanFace} onPress={continueSetup} />
          )}
          {setupDone && <Button label="Go to Family" icon={Users} onPress={goToFamily} />}

          {/* ---------- setup checklist ---------- */}
          <ChecklistCard title="Setup checklist" steps={stepsFor(m, docDone)} />

          {/* ---------- profile ---------- */}
          <Group title="Profile">
            {m.dateOfBirth ? (
              <ListRow icon={CalendarDays} title="Date of birth" value={formatDate(m.dateOfBirth)} chevron={false} />
            ) : null}
            <ListRow
              icon={History}
              tone="sky"
              title="Activity"
              sub="Check-ins and verification events"
              onPress={() =>
                router.push({ pathname: '/family/[id]/activity', params: { id, name: m.name } } as never)
              }
            />
          </Group>

          {/* ---------- documents ---------- */}
          <View style={{ gap: 10 }}>
            <Txt v="micro" style={{ marginLeft: 4 }}>
              Documents
            </Txt>
            <Async
              q={memberDocs}
              compact
              skeleton={<SkeletonList rows={2} thumb={40} />}
              empty={(docs) => docs.length === 0}
              emptyView={
                <EmptyView
                  compact
                  icon={FileText}
                  title="No documents yet"
                  body={`Add a document to verify ${first}.`}
                  action={<Button label="Add a document" tone="soft" size="md" icon={FilePlus} onPress={addDocument} />}
                />
              }>
              {(docs) => (
                <Group>
                  {[
                    ...docs.map((d) => (
                      <DocRow key={d.id} doc={d} onPress={() => router.push(`/document/${d.id}` as never)} />
                    )),
                    <ListRow
                      key="add"
                      icon={FilePlus}
                      tone="sky"
                      title="Add a document"
                      sub="Passport, ID card or birth certificate"
                      onPress={addDocument}
                    />,
                  ]}
                </Group>
              )}
            </Async>
          </View>

          {/* ---------- manage (enrolled members) ---------- */}
          {isFaceDone(m) && (
            <Group title="Manage">
              <ListRow
                icon={isPhoto ? Camera : ScanFace}
                tone="sky"
                title={isPhoto ? 'Retake face photo' : 'Update face'}
                sub={isPhoto ? `Replace ${first}'s enrolled photo` : `New liveness check for ${first}`}
                onPress={updateFace}
              />
            </Group>
          )}

          {/* ---------- permissions (approved design, no backend yet) ---------- */}
          <SoonOverlay>
            <Group title="Permissions">
              <ListRow icon={UserCheck} title="Check in independently" sub="Without you present" trailing={<Toggle on={false} />} />
              <ListRow icon={BellRing} title="Notify me on every check-in" sub="Real-time alerts to your phone" trailing={<Toggle on={false} />} />
            </Group>
          </SoonOverlay>

          <Button
            label="Remove from family"
            tone="ghost"
            icon={Trash2}
            loading={removeMember.isPending}
            onPress={() => setConfirmRemove(true)}
            style={{ marginTop: -8 }}
          />
        </View>
      </ScrollView>

      <ConfirmSheet
        visible={photoSheet}
        icon={Camera}
        title={photoUri ? `Change ${first}'s photo` : `Add ${first}'s photo`}
        body="Use a clear photo of their face. It is kept on this phone and only shown to you."
        confirmLabel="Take photo"
        onConfirm={() => void choosePhoto('camera')}
        onCancel={() => setPhotoSheet(false)}>
        <Button label="Choose from gallery" tone="soft" icon={ImageIcon} onPress={() => void choosePhoto('library')} />
      </ConfirmSheet>
      <ConfirmSheet
        visible={confirmRemove}
        danger
        icon={Trash2}
        title={`Remove ${m.name}?`}
        body={`${first} will be removed from your family.`}
        confirmLabel="Remove member"
        loading={removeMember.isPending}
        onConfirm={() => void doRemove()}
        onCancel={() => setConfirmRemove(false)}
      />
    </View>
  );
}
