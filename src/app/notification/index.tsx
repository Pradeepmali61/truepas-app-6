/** @jsxImportSource react */
/**
 * Notifications — the server inbox (GET /cb/notifications), grouped by day.
 * Type chips filter on the server (?type=). Tapping an unread item marks it
 * read (POST /notifications/{id}/read); every item with a target opens it
 * (see notificationHref). "Read all" → POST /notifications/read-all, shown
 * while the unread count is above zero. The gear opens push preferences.
 */
import { useRouter } from 'expo-router';
import {
  Bell,
  CalendarClock,
  CircleUserRound,
  FileText,
  type LucideIcon,
  ScanFace,
  Settings2,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationCount,
  useNotifications,
} from '@/features/notifications/hooks';
import { notificationHref, notificationKind } from '@/features/notifications/links';
import { useToast } from '@/hooks/useToast';
import { Async, EmptyView, SkeletonList, Spinner } from '@/premium/kit';
import { C, F } from '@/premium/theme';
import { Card, Chip, Divider, go, Heading, IconCircle, Row, Screen, TextLink, Tile, TopBar, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';
import type { Notification, NotificationType } from '@/types/domain';

type Filter = NotificationType | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'booking', label: 'Bookings' },
  { key: 'document', label: 'Documents' },
  { key: 'family', label: 'Family' },
  { key: 'identity', label: 'Identity' },
  { key: 'account', label: 'Account' },
];

const EMPTY: Record<Filter, { title: string; body: string }> = {
  all: { title: "You're all caught up", body: 'Booking, document, family and account updates land here.' },
  booking: { title: 'No booking updates', body: 'Reservations and check-ins show up here.' },
  document: { title: 'No document updates', body: 'Document checks show up here.' },
  family: { title: 'No family updates', body: 'Members added or removed show up here.' },
  identity: { title: 'No identity updates', body: 'Face changes show up here.' },
  account: { title: 'No account updates', body: 'Password and PIN changes show up here.' },
};

const TYPE_ICON: Record<NotificationType, LucideIcon> = {
  booking: CalendarClock,
  document: FileText,
  family: Users,
  identity: ScanFace,
  account: CircleUserRound,
};

const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Earlier';
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - t) / 60_000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const router = useRouter();
  const toast = useToast();
  const selfId = useAppSelector((state) => state.auth.user?.id);
  const [filter, setFilter] = useState<Filter>('all');
  const [pulling, setPulling] = useState(false);

  const inbox = useNotifications(false, filter === 'all' ? undefined : filter);
  const count = useNotificationCount();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const list = inbox.data ? inbox.data.pages.flat() : undefined;
  const unread = count.data?.unread ?? 0;

  // Own flag, not isRefetching: every mark-read refetches the inbox, and the
  // pull spinner should only show for a pull.
  const refresh = async () => {
    setPulling(true);
    try {
      await Promise.all([inbox.refetch(), count.refetch()]);
    } finally {
      setPulling(false);
    }
  };

  const open = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id);
    const href = notificationHref(n, selfId);
    if (href) router.push(href as never);
  };

  const readAll = () =>
    markAll.mutate(undefined, { onError: () => toast.show('error', "Couldn't mark them as read. Try again.") });

  return (
    <Screen
      header={
        <TopBar
          title="Notifications"
          right={
            <Row gap={10}>
              {unread > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Mark all ${unread} as read`}
                  onPress={readAll}
                  disabled={markAll.isPending}
                  hitSlop={8}
                  style={{ minHeight: 44, justifyContent: 'center' }}
                >
                  <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.skyPressed }}>Read all</Text>
                </Pressable>
              )}
              <IconCircle icon={Settings2} label="Notification preferences" onPress={go('/notification/preferences')} />
            </Row>
          }
        />
      }
      refreshing={pulling}
      onRefresh={() => void refresh()}
      contentStyle={{ paddingTop: 4 }}
    >
      <Heading title="Stay in the" accent="loop." sub={unread > 0 ? `${unread} unread` : undefined} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </ScrollView>

      <Async
        q={{ data: list, isPending: inbox.isPending, isError: inbox.isError, error: inbox.error, refetch: inbox.refetch }}
        empty={(l) => l.length === 0}
        emptyView={
          <EmptyView
            icon={filter === 'all' ? Bell : TYPE_ICON[filter]}
            title={EMPTY[filter].title}
            body={EMPTY[filter].body}
          />
        }
        skeleton={<SkeletonList rows={4} thumb={42} />}
      >
        {(items) => {
          const groups: { label: string; items: Notification[] }[] = [];
          for (const n of items) {
            const label = dayLabel(n.createdAt);
            const group = groups.find((g) => g.label === label);
            if (group) group.items.push(n);
            else groups.push({ label, items: [n] });
          }
          return (
            <>
              {groups.map((g) => (
                <View key={g.label} style={{ gap: 10 }}>
                  <Txt v="micro" style={{ marginLeft: 4 }}>
                    {g.label}
                  </Txt>
                  <Card pad={0} style={{ paddingHorizontal: 16 }}>
                    {g.items.map((n, i) => {
                      const kind = notificationKind(n);
                      const Icon = kind ? TYPE_ICON[kind] : Bell;
                      const actionable = !n.read || notificationHref(n, selfId) != null;
                      return (
                        <View key={n.id}>
                          {i > 0 && <Divider inset={56} />}
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={n.read ? n.title : `Unread: ${n.title}`}
                            disabled={!actionable}
                            onPress={() => open(n)}
                            style={({ pressed }) => (pressed ? { opacity: 0.6 } : undefined)}
                          >
                            <Row gap={14} align="flex-start" style={{ paddingVertical: 16, minHeight: 44 }}>
                              <Tile icon={Icon} tone={n.read ? 'neutral' : 'sky'} size={42} radius={21} />
                              <View style={{ flex: 1, gap: 3 }}>
                                <Txt
                                  v={n.read ? 'body' : 'bodyStrong'}
                                  color={C.ink}
                                  lines={1}
                                  style={{ lineHeight: 20 }}
                                >
                                  {n.title}
                                </Txt>
                                <Txt v="small" lines={2} style={{ lineHeight: 19 }}>
                                  {n.body}
                                </Txt>
                              </View>
                              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                                <Txt v="small" color={C.ink4}>
                                  {relTime(n.createdAt)}
                                </Txt>
                                {!n.read && (
                                  <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.sky }} />
                                )}
                              </View>
                            </Row>
                          </Pressable>
                        </View>
                      );
                    })}
                  </Card>
                </View>
              ))}
              {inbox.hasNextPage && (
                <View style={{ alignItems: 'center' }}>
                  {inbox.isFetchingNextPage ? (
                    <Spinner size={20} />
                  ) : (
                    <TextLink label="Load more" onPress={() => void inbox.fetchNextPage()} />
                  )}
                </View>
              )}
            </>
          );
        }}
      </Async>
    </Screen>
  );
}
