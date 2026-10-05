import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

import { api } from '@/api';
import type { Notification, NotificationCount, NotificationPreferences, NotificationType } from '@/types/domain';

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

// ── Read state (server) ───────────────────────────────────────────────
// The inbox and the counts share the ['notifications'] prefix. A mark-read
// flips the cached items and lowers the cached unread counts straight away
// (so the dot and the Home bell clear on tap), then refetches the server copy.

type Inbox = InfiniteData<Notification[]>;

const isInbox = (d: unknown): d is Inbox => !!d && typeof d === 'object' && Array.isArray((d as Inbox).pages);

/** `ids` null = every notification. */
async function markReadLocally(qc: QueryClient, ids: string[] | null) {
  await qc.cancelQueries({ queryKey: notificationKeys.all });
  const hit = (n: Notification) => ids == null || ids.includes(n.id);

  // Unread items this clears, from whatever pages are cached (any filter).
  const cleared = new Map<string, Notification>();
  for (const [, d] of qc.getQueriesData<unknown>({ queryKey: notificationKeys.all })) {
    if (!isInbox(d)) continue;
    for (const n of d.pages.flat()) if (!n.read && hit(n)) cleared.set(n.id, n);
  }

  const now = new Date().toISOString();
  qc.setQueriesData<Inbox>({ queryKey: notificationKeys.all, predicate: (q) => isInbox(q.state.data) }, (d) =>
    d
      ? { ...d, pages: d.pages.map((p) => p.map((n) => (hit(n) ? { ...n, read: true, readAt: n.readAt ?? now } : n))) }
      : d,
  );

  // Count keys are ['notifications', 'count', type | 'all'].
  for (const q of qc.getQueryCache().findAll({ queryKey: ['notifications', 'count'] })) {
    const key = String(q.queryKey[2]);
    qc.setQueryData<NotificationCount>(q.queryKey, (c) => {
      if (!c || typeof c.unread !== 'number') return c;
      if (ids == null) return { ...c, unread: 0 };
      const minus = [...cleared.values()].filter((n) => key === 'all' || n.type === key).length;
      return minus > 0 ? { ...c, unread: Math.max(0, c.unread - minus) } : c;
    });
  }
}

function useReadMutation<V>(mutationFn: (v: V) => Promise<unknown>, ids: (v: V) => string[] | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onMutate: (v: V) => markReadLocally(qc, ids(v)),
    onSettled: () => qc.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

/** POST /cb/notifications/{id}/read */
export function useMarkNotificationRead() {
  return useReadMutation((id: string) => api.markNotificationRead(id), (id) => [id]);
}

/** POST /cb/notifications/read { notification_ids } */
export function useMarkNotificationsRead() {
  return useReadMutation((ids: string[]) => api.markNotificationsRead(ids), (ids) => ids);
}

/** POST /cb/notifications/read-all */
export function useMarkAllNotificationsRead() {
  return useReadMutation((_: void) => api.markAllNotificationsRead(), () => null);
}

// ── Preferences ───────────────────────────────────────────────────────

/** Push categories (off stops push only; the inbox still records them). */
export function useNotificationPreferences() {
  return useQuery({ queryKey: notificationKeys.preferences, queryFn: () => api.getNotificationPreferences() });
}

const PREFS_MUTATION = ['notification-preferences', 'update'] as const;

/** Optimistic PUT of only what changed; rolls back on error. Quick taps on
 *  several toggles overlap, so only the last one to settle writes the server
 *  copy back — an earlier response would flip a later toggle back for a beat. */
export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  const isLast = () => qc.isMutating({ mutationKey: PREFS_MUTATION }) === 1;
  return useMutation({
    mutationKey: PREFS_MUTATION,
    mutationFn: (patch: Partial<NotificationPreferences>) => api.updateNotificationPreferences(patch),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: notificationKeys.preferences });
      const previous = qc.getQueryData<NotificationPreferences>(notificationKeys.preferences);
      if (previous) qc.setQueryData(notificationKeys.preferences, { ...previous, ...patch });
      return { previous };
    },
    onError: (_e, patch, ctx) => {
      // Undo only the keys this call changed — other toggles may have moved since.
      const previous = ctx?.previous;
      if (!previous) return;
      const undo: Partial<NotificationPreferences> = {};
      for (const k of Object.keys(patch) as (keyof NotificationPreferences)[]) undo[k] = previous[k];
      qc.setQueryData<NotificationPreferences>(notificationKeys.preferences, (cur) => (cur ? { ...cur, ...undo } : cur));
    },
    onSuccess: (data) => {
      if (data && isLast()) qc.setQueryData(notificationKeys.preferences, data);
    },
    onSettled: (_d, error) => {
      if (error && isLast()) void qc.invalidateQueries({ queryKey: notificationKeys.preferences });
    },
  });
}
