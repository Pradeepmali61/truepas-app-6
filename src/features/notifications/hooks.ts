import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import type { Notification, NotificationPreferences, NotificationType } from '@/types/domain';

const PAGE_SIZE = 50;

export const notificationKeys = {
  all: ['notifications'] as const,
  count: (type?: NotificationType) => ['notifications', 'count', type ?? 'all'] as const,
  preferences: ['notification-preferences'] as const,
};

/** Notifications inbox — GET /cb/notifications with limit/offset pagination
 *  and an optional type filter (booking / document / family / identity / account). */
export function useNotifications(unreadOnly = false, type?: NotificationType) {
  return useInfiniteQuery<Notification[]>({
    queryKey: ['notifications', { unreadOnly, type: type ?? null }],
    queryFn: ({ pageParam }) =>
      api.getNotifications({ limit: PAGE_SIZE, offset: pageParam as number, unreadOnly, type }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });
}

/** Unread / total badge counts — GET /cb/notifications/count. */
export function useNotificationCount(type?: NotificationType) {
  return useQuery({ queryKey: notificationKeys.count(type), queryFn: () => api.getNotificationCount(type) });
}

function useInvalidateInbox() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateInbox();
  return useMutation({ mutationFn: (id: string) => api.markNotificationRead(id), onSuccess: invalidate });
}

export function useMarkNotificationsRead() {
  const invalidate = useInvalidateInbox();
  return useMutation({ mutationFn: (ids: string[]) => api.markNotificationsRead(ids), onSuccess: invalidate });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateInbox();
  return useMutation({ mutationFn: () => api.markAllNotificationsRead(), onSuccess: invalidate });
}

/** Push categories (off stops push only; the inbox still records them). */
export function useNotificationPreferences() {
  return useQuery({ queryKey: notificationKeys.preferences, queryFn: () => api.getNotificationPreferences() });
}

/** Optimistic PUT of only what changed; rolls back on error. */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => api.updateNotificationPreferences(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: notificationKeys.preferences });
      const previous = qc.getQueryData<NotificationPreferences>(notificationKeys.preferences);
      if (previous) qc.setQueryData(notificationKeys.preferences, { ...previous, ...patch });
      return { previous };
    },
    onError: (_e, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(notificationKeys.preferences, ctx.previous);
    },
    onSuccess: (data) => qc.setQueryData(notificationKeys.preferences, data),
  });
}
