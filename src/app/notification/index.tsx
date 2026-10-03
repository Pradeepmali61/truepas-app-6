/** @jsxImportSource react */
/**
 * Notifications — inbox pushed over the tabs, grouped by day. Read state is
 * local only (the contract exposes no mark-read endpoint): tapping a row
 * marks it read, "Mark all read" clears the rest.
 */
import {
  Bell,
  CalendarClock,
  CircleUserRound,
  FileText,
  type LucideIcon,
  ScanFace,
  Users,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useNotifications } from '@/features/notifications/hooks';
import { Async, EmptyView, SkeletonList, Spinner } from '@/premium/kit';
import { C, F } from '@/premium/theme';
import { Card, Chip, Divider, Heading, Row, Screen, TextLink, Tile, TopBar, Txt } from '@/premium/ui';
import type { Notification } from '@/types/domain';

const TYPE_ICON: Record<string, LucideIcon> = {
  identity: ScanFace,
  document: FileText,
  account: CircleUserRound,
  booking: CalendarClock,
  family: Users,
};

const TYPE_LABEL: Record<string, string> = {
  identity: 'Identity',
  document: 'Documents',
  account: 'Account',
  booking: 'Check-ins',
  family: 'Family',
};

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(new Date()) - startOf(d)) / 86_400_000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function relTime(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function NotificationsScreen() {
  const { data, isPending, isError, error, isRefetching, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useNotifications();
  const list = data ? data.pages.flat() : undefined;
  const [readIds, setReadIds] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<string>('all');

  const isUnread = (n: Notification) => !n.read && !readIds[n.id];
  const markRead = (id: string) => setReadIds((s) => ({ ...s, [id]: true }));
  const markAll = () =>
    setReadIds((s) => {
      const next = { ...s };
      for (const n of list ?? []) next[n.id] = true;
      return next;
    });
  const unreadCount = (list ?? []).filter(isUnread).length;

  /* Category chips filter locally by `type` — only for known types present. */
  const types = Array.from(new Set((list ?? []).map((n) => n.type ?? '').filter((t) => TYPE_LABEL[t] != null)));
  const showChips = types.length > 1;
  const activeFilter = showChips && types.includes(filter) ? filter : 'all';

  return (
    <Screen
      header={
        <TopBar
          title="Notifications"
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark all read"
              accessibilityState={{ disabled: unreadCount === 0 }}
              disabled={unreadCount === 0}
              onPress={markAll}
              hitSlop={8}
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: F.bold, fontSize: 14, color: unreadCount === 0 ? C.ink4 : C.skyPressed }}>
                Read all
              </Text>
            </Pressable>
          }
        />
      }
      refreshing={isRefetching}
      onRefresh={() => void refetch()}
      contentStyle={{ paddingTop: 4 }}
    >
      <Heading title="Stay in the" accent="loop." />

      <Async
        q={{ data: list, isPending, isError, error, refetch }}
        empty={(l) => l.length === 0}
        emptyView={
          <EmptyView icon={Bell} title="You're all caught up" body="Identity, document, and booking updates land here." />
        }
        skeleton={<SkeletonList rows={4} thumb={42} />}
      >
        {(items) => {
          const shown = activeFilter === 'all' ? items : items.filter((n) => n.type === activeFilter);
          const groups: { label: string; items: Notification[] }[] = [];
          for (const n of shown) {
            const label = dayLabel(n.createdAt);
            const group = groups.find((g) => g.label === label);
            if (group) group.items.push(n);
            else groups.push({ label, items: [n] });
          }
          return (
            <>
              {showChips && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <Chip label="All" active={activeFilter === 'all'} onPress={() => setFilter('all')} />
                  {types.map((t) => (
                    <Chip key={t} label={TYPE_LABEL[t]} active={activeFilter === t} onPress={() => setFilter(t)} />
                  ))}
                </ScrollView>
              )}
              {groups.map((g) => (
                <View key={g.label} style={{ gap: 10 }}>
                  <Txt v="micro" style={{ marginLeft: 4 }}>
                    {g.label}
                  </Txt>
                  <Card pad={0} style={{ paddingHorizontal: 16 }}>
                    {g.items.map((n, i) => {
                      const unread = isUnread(n);
                      const Icon = TYPE_ICON[n.type ?? ''] ?? Bell;
                      return (
                        <View key={n.id}>
                          {i > 0 && <Divider inset={56} />}
                          <Pressable accessibilityRole="button" accessibilityLabel={n.title} onPress={() => markRead(n.id)}>
                            <Row gap={14} align="flex-start" style={{ paddingVertical: 16, minHeight: 44 }}>
                              <Tile icon={Icon} tone={unread ? 'sky' : 'neutral'} size={42} radius={21} />
                              <View style={{ flex: 1, gap: 3 }}>
                                <Txt
                                  v={unread ? 'bodyStrong' : 'body'}
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
                                {unread && <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: C.sky }} />}
                              </View>
                            </Row>
                          </Pressable>
                        </View>
                      );
                    })}
                  </Card>
                </View>
              ))}
              {hasNextPage && (
                <View style={{ alignItems: 'center' }}>
                  {isFetchingNextPage ? (
                    <Spinner size={20} />
                  ) : (
                    <TextLink label="Load more" onPress={() => void fetchNextPage()} />
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
