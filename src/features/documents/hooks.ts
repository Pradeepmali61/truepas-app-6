import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import type { AddDocumentRequest, SupportedDocumentType } from '@/types/domain';

export const documentKeys = {
  all: ['documents'] as const,
  supportedTypes: ['document-types', 'supported'] as const,
  images: (id: string) => ['document-images', id] as const,
  detail: (id: string) => ['documents', id] as const,
  member: (personId: string) => ['documents', 'member', personId] as const,
};

export function useDocuments(personId?: string) {
  return useQuery({
    queryKey: personId ? documentKeys.member(personId) : documentKeys.all,
    queryFn: () => api.getDocuments(personId),
    // Always refetch when the screen mounts — ensures newly added documents
    // show up even if cache invalidation timing is off.
    refetchOnMount: true,
    select: (data) => {
      console.log('[useDocuments] personId=', personId, '| docs returned=', data?.length, '| ids=', data?.map(d => d.id).join(','));
      return data;
    },
  });
}

export function useDocument(id?: string) {
  return useQuery({
    queryKey: documentKeys.detail(id ?? ''),
    queryFn: () => api.getDocument(id!),
    enabled: !!id,
  });
}

export function useAddDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddDocumentRequest) => api.addDocument(payload),
    onSuccess: (data, variables) => {
      // Invalidate all document queries (covers both self and member lists)
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      // Per KYC guide §7: identity summary must be invalidated after
      // document changes so gating reflects the new document state.
      queryClient.invalidateQueries({ queryKey: ['identity'] });
      // Also explicitly invalidate the member-specific query if personId was set
      if (variables.personId) {
        queryClient.invalidateQueries({ queryKey: documentKeys.member(variables.personId) });
      }
    },
  });
}

export function useRemoveDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.removeDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.all });
      // Identity summary derives document state — same invalidation as add.
      queryClient.invalidateQueries({ queryKey: ['identity'] });
    },
  });
}

/** GET /documents/types/supported — the picker's source of truth (§6.1). */
export function useSupportedDocumentTypes() {
  return useQuery({
    queryKey: documentKeys.supportedTypes,
    queryFn: () => api.getSupportedDocumentTypes(),
    staleTime: 60 * 60_000,
  });
}

/** Types allowed for a person of this age (undefined age = adult). */
export function allowedDocumentTypes(types: SupportedDocumentType[], age?: number): SupportedDocumentType[] {
  const a = age ?? 18;
  return types.filter(
    (t) =>
      (a < 18 ? t.allowedForMinors : t.allowedForAdults) &&
      (t.minAge == null || a >= t.minAge) &&
      (t.maxAge == null || a <= t.maxAge),
  );
}

/** Signed, expiring image URLs — staleTime stays short so they're refetched
 *  rather than reused after they expire. */
export function useDocumentImages(id?: string) {
  return useQuery({
    queryKey: documentKeys.images(id ?? ''),
    queryFn: () => api.getDocumentImages(id as string),
    enabled: !!id,
    staleTime: 60_000,
  });
}
