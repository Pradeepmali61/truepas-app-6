/** @jsxImportSource react */
/**
 * Add family — step 1: member basics. Nothing is created here (POST
 * /cb/family runs in processing, after the document scan). Any age is
 * accepted; the flow branches on computed age: 0-4 photo, 5-9 liveness
 * (any camera), 10+ front-camera liveness.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ArrowRight, User, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { api } from '@/api';
import { ageBandFromAge, ageFromDob, familyKeys, findMatchingMember } from '@/features/family/hooks';
import { DateField } from '@/premium/flows/family';
import { Banner, ConfirmSheet } from '@/premium/kit';
import { C } from '@/premium/theme';
import { Button, Chip, Field, Heading, Row, Screen, Steps, TopBar, Txt } from '@/premium/ui';
import type { FamilyMember } from '@/types/domain';

const RELATIONSHIPS = ['Child', 'Spouse', 'Parent', 'Guardian', 'Sibling', 'Other'];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AddFamilyScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [relationship, setRelationship] = useState('Child');
  const [errors, setErrors] = useState<{ name?: string; dob?: string; relationship?: string }>({});
  const [checking, setChecking] = useState(false);
  const [existing, setExisting] = useState<FamilyMember | null>(null);

  const submit = async () => {
    const trimmed = fullName.trim();
    const next: typeof errors = {};
    if (trimmed.length < 2) next.name = 'Name is required';
    else if (trimmed.length > 100) next.name = 'Name is too long';
    if (!dob) next.dob = 'Pick a date of birth';
    else {
      const age = ageFromDob(dob);
      if (!Number.isFinite(age)) next.dob = 'Enter a valid date';
      else if (age < 0) next.dob = 'Date of birth must be in the past';
    }
    if (!relationship) next.relationship = 'Choose a relationship';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    // Catch a duplicate HERE, before the user spends a document scan on it —
    // the backend rejects the same name + DOB at the end of the flow.
    setChecking(true);
    try {
      const list = await queryClient.fetchQuery({
        queryKey: familyKeys.all,
        queryFn: api.getFamily,
        staleTime: 30_000,
      });
      const match = findMatchingMember(list, trimmed, dob);
      if (match) {
        setExisting(match);
        return;
      }
    } catch {
      // List unavailable — let the flow continue; processing handles the
      // backend's duplicate rejection.
    } finally {
      setChecking(false);
    }

    const age = ageFromDob(dob);
    const band = ageBandFromAge(age);
    router.push({
      pathname: '/family/add/document',
      params: { name: trimmed, band, dob, relationship },
    } as never);
  };

  return (
    <Screen
      keyboard
      header={
        <TopBar
          title="Add member"
          right={
            <Txt v="smallStrong" color={C.ink3}>
              1/3
            </Txt>
          }
        />
      }
      contentStyle={{ paddingTop: 8 }}
      footer={
        <Button
          label="Continue"
          iconRight={ArrowRight}
          loading={checking}
          disabled={checking}
          onPress={() => void submit()}
        />
      }>
      <Steps total={3} current={0} />
      <Heading title="Who's joining" accent="you?" sub="They'll get their own profile, linked to your family." />

      <View style={{ gap: 10 }}>
        <Txt v="smallStrong" color={C.ink2}>
          Relationship
        </Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {RELATIONSHIPS.map((r) => (
            <Chip key={r} label={r} active={relationship === r} onPress={() => setRelationship(r)} />
          ))}
        </Row>
        {errors.relationship ? (
          <Txt v="small" color={C.redInk}>
            {errors.relationship}
          </Txt>
        ) : null}
      </View>

      <View style={{ gap: 18 }}>
        <Field
          label="Full name"
          icon={User}
          placeholder="Maya Example"
          value={fullName}
          onChangeText={setFullName}
          hint="As on their document."
          error={errors.name}
          inputProps={{ autoCapitalize: 'words', maxLength: 100, autoComplete: 'off' }}
        />
        <DateField
          label="Date of birth"
          value={dob || undefined}
          onChange={setDob}
          placeholder="Select date of birth"
          maxDate={todayIso()}
          error={errors.dob}
        />
      </View>

      <Banner
        tone="info"
        title="Verification depends on age"
        body="Under 5: document + photo. Ages 5–9: document + liveness (any camera). 10+: document + front-camera liveness."
      />

      <ConfirmSheet
        visible={!!existing}
        icon={UserRound}
        title={existing ? `${existing.name} is already in your family` : 'Already in your family'}
        body="Open their profile to continue their setup, or change the details you entered."
        confirmLabel={existing ? `Open ${existing.name.split(' ')[0]}` : 'Open'}
        cancelLabel="Change details"
        onConfirm={() => {
          if (existing) router.replace({ pathname: '/family/[id]', params: { id: existing.id } });
        }}
        onCancel={() => setExisting(null)}
      />
    </Screen>
  );
}
