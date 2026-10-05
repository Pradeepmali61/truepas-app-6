import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { api } from '@/api';
import { flowGuards } from '@/services/flowGuards';
import { deleteMemberProfileImage, getMemberProfileImage, saveMemberFacePhoto } from '@/services/profileImageStore';
import { ageFromDob } from '@/utils/age';
import type { AddFamilyMemberRequest, FamilyAgeBand, FamilyMember } from '@/types/domain';

export { ADULT_AGE, ageFromDob } from '@/utils/age';

export const familyKeys = {
  all: ['family'] as const,
  detail: (id: string) => ['family', id] as const,
  activity: (id: string) => ['family', id, 'activity'] as const,
};

export function useFamily() {
  return useQuery({ queryKey: familyKeys.all, queryFn: api.getFamily });
}

export function useFamilyMember(id?: string) {
  return useQuery({
    queryKey: familyKeys.detail(id ?? ''),
    queryFn: () => api.getFamilyMember(id!),
    enabled: !!id,
  });
}

export function useFamilyActivity(id?: string) {
  return useQuery({
    queryKey: familyKeys.activity(id ?? ''),
    queryFn: () => api.getFamilyActivity(id!),
    enabled: !!id,
  });
}

export function useAddFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddFamilyMemberRequest) => api.addFamilyMember(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

/** PATCH /family/{id}/permissions — notifyOnCheckIn works; independentCheckIn
 *  is stored but not enforced yet (show it as coming soon). */
export function useUpdateFamilyPermissions(personId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NonNullable<FamilyMember['permissions']>>) => api.updateFamilyPermissions(personId, patch),
    onSuccess: (member) => {
      queryClient.setQueryData(familyKeys.detail(personId), member);
      void queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

export function useRemoveFamilyMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeFamilyMember(id),
    onSuccess: (_data, id) => {
      deleteMemberProfileImage(id).catch(() => {});
      queryClient.removeQueries({ queryKey: memberPhotoKey(id) });
      queryClient.invalidateQueries({ queryKey: familyKeys.all });
    },
  });
}

const memberPhotoKey = (personId: string) => ['member-photo', personId] as const;

/**
 * A member's avatar photo: the face photo saved on this device at enrolment
 * (the API has no member photo URL yet). Null on web, on another device, or
 * before enrolment, so callers fall back to initials.
 */
const memberPhotoQuery = (personId: string) => ({
  queryKey: memberPhotoKey(personId),
  queryFn: async () => {
    const uri = await getMemberProfileImage(personId);
    // Same file path on re-enrolment: bust the image cache per read.
    return uri ? `${uri}?t=${Date.now()}` : null;
  },
  staleTime: Infinity,
});

export function useMemberPhoto(personId?: string): string | null {
  const query = useQuery({ ...memberPhotoQuery(personId ?? ''), enabled: !!personId });
  return query.data ?? null;
}

/** Members with no photo on this device (resolved checks only). */
export function useMembersWithoutPhoto(members: FamilyMember[]): FamilyMember[] {
  const results = useQueries({ queries: members.map((m) => memberPhotoQuery(m.id)) });
  return members.filter((_m, i) => results[i]?.isSuccess && !results[i]?.data);
}

export type PickPhotoResult = 'saved' | 'cancelled' | 'denied' | 'failed';

/**
 * Set a member's avatar from the camera or the gallery (members whose photo
 * wasn't captured on this phone). Square crop, shrunk and kept on this device
 * like the enrolment photo, until the backend stores member photos.
 */
export function useSetMemberPhoto(personId: string) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const pick = async (source: 'camera' | 'library'): Promise<PickPhotoResult> => {
    if (busy) return 'cancelled';
    setBusy(true);
    try {
      if (source === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') return 'denied';
      } else if (Platform.OS === 'ios') {
        // Android uses the system photo picker — no storage permission needed.
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return 'denied';
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 };
      const result =
        source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const uri = result.canceled ? null : result.assets[0]?.uri;
      if (!uri) return 'cancelled';
      await saveMemberFacePhoto(personId, uri);
      await queryClient.invalidateQueries({ queryKey: memberPhotoKey(personId) });
      return 'saved';
    } catch {
      return 'failed';
    } finally {
      setBusy(false);
    }
  };
  return { pick, busy };
}

/** Save the enrolment capture as the member's avatar. Best effort: a failure
 *  here must never fail the enrolment itself. */
export function useRememberMemberPhoto() {
  const queryClient = useQueryClient();
  return async (personId: string, captureUri: string) => {
    try {
      await saveMemberFacePhoto(personId, captureUri);
      await queryClient.invalidateQueries({ queryKey: memberPhotoKey(personId) });
    } catch {
      // keep initials
    }
  };
}

/** Backend age rules: 0-4 photo enrollment · 5-9 liveness (front or back camera) · 10+ liveness (front only). */
export function ageBandFromAge(age: number): FamilyAgeBand {
  if (age >= 10) return '10+';
  if (age >= 5) return '5-9';
  return '0-4';
}

/** Member already on the account with the same name + DOB (age when the
 *  backend omits dateOfBirth) — the backend rejects re-adding them. */
export function findMatchingMember(
  list: FamilyMember[] | undefined,
  name: string,
  dob: string,
): FamilyMember | null {
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
  const day = dob.split('T')[0];
  const age = ageFromDob(dob);
  return (
    (list ?? []).find(
      (m) =>
        norm(m.name) === norm(name) &&
        (m.dateOfBirth ? m.dateOfBirth.split('T')[0] === day : m.age === age),
    ) ?? null
  );
}

/** Backend "already exists" rejection on POST /family. */
export function isDuplicateMemberError(err: any): boolean {
  const status = err?.response?.status;
  const msg = String(err?.response?.data?.message ?? '');
  return status === 409 || /already exists/i.test(msg);
}

/** One-shot flag the PIN screen grants before a member face update. */
export const MEMBER_FACE_UPDATE_GUARD = 'family:face-update';

/**
 * PIN gate for a member's face update (PRD FR-04: PIN before any face
 * update). /face-update/pin grants the flag and opens the member capture
 * screen with update=1; the screen consumes it on mount, so a deep link or a
 * replay can't skip the PIN. First-time enrolment (isUpdate false) is never
 * gated. Returns false when the screen must bounce to the PIN step.
 */
export function useMemberFaceUpdateGate(isUpdate: boolean): boolean {
  const [granted] = useState(() => !isUpdate || flowGuards.has(MEMBER_FACE_UPDATE_GUARD));
  useEffect(() => {
    if (isUpdate && granted) flowGuards.consume(MEMBER_FACE_UPDATE_GUARD);
  }, [isUpdate, granted]);
  return granted;
}
