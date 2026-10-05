import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { api } from '@/api';
import { accountKeys } from '@/features/account/hooks';
import { getLocalProfileImage, saveLocalProfileImage } from '@/services/profileImageStore';
import type { ProfilePictureResponse } from '@/types/domain';

const PROFILE_PICTURE_KEY = ['profile-picture'] as const;

/**
 * Profile picture source — the signed `profileImageUrl` from GET /user/me
 * (api.getProfilePicture) when the account has one, otherwise the copy kept
 * on this device.
 *
 * The local file is ALWAYS loaded as a fallback so the picture still shows
 * offline or when the photo call fails. It is refreshed on every upload.
 */
export function useProfilePicture() {
  const query = useQuery({
    queryKey: PROFILE_PICTURE_KEY,
    queryFn: () => api.getProfilePicture(),
    staleTime: 1000 * 60 * 50, // 50 min (signed URL lifetime)
    retry: false,
  });
  const [localUri, setLocalUri] = useState<string | null>(null);

  useEffect(() => {
    getLocalProfileImage()
      .then(setLocalUri)
      .catch(() => {});
  }, []);

  // Cache-bust ONLY local file URIs: saveLocalProfileImage overwrites the
  // same path on every upload, so React Native's Image cache would show the
  // stale picture. Signed server URLs are left untouched — appending a query
  // param would invalidate the signature. An empty url counts as none.
  const rawUrl = query.data?.url || localUri;
  const url = rawUrl && rawUrl.startsWith('file://')
    ? `${rawUrl}?t=${encodeURIComponent(query.data?.updated_at ?? '0')}`
    : rawUrl;

  return {
    url,
    isLoading: query.isPending,
  };
}

/**
 * Upload through the persons API (upload URL → PUT the image → save the
 * object key; api.uploadProfilePicture). A copy is always kept on this device
 * as the offline fallback; if the upload itself fails, that local copy is
 * what shows and the result has `localOnly: true`.
 */
export function useUploadProfilePicture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageUri: string): Promise<ProfilePictureResponse & { localOnly?: boolean }> => {
      const keepLocal = () => saveLocalProfileImage(imageUri);
      try {
        const res = await api.uploadProfilePicture(imageUri);
        const local = await keepLocal().catch(() => null);
        // No signed URL back yet (or the picker's temp file) → show the
        // persisted local copy instead.
        if (!res.url || res.url === imageUri) {
          return { url: local ?? imageUri, expires_in: 0, updated_at: new Date().toISOString() };
        }
        return res;
      } catch (err) {
        console.warn('[ProfilePicture] Upload failed, keeping the picture on this device:', (err as Error)?.message);
        const uri = await keepLocal();
        return { url: uri, expires_in: 0, updated_at: new Date().toISOString(), localOnly: true };
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(PROFILE_PICTURE_KEY, data);
      // /user/me carries profileImageUrl too.
      void queryClient.invalidateQueries({ queryKey: accountKeys.me });
    },
  });
}
