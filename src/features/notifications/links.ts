import type { Notification, NotificationType } from '@/types/domain';

const KINDS: readonly NotificationType[] = ['booking', 'document', 'family', 'identity', 'account'];

/** The item's kind: `data.type` first, else the inbox `notification_type`. */
export function notificationKind(n: Pick<Notification, 'type' | 'data'>): NotificationType | null {
  const t = n.data?.type ?? n.type;
  return KINDS.includes(t as NotificationType) ? (t as NotificationType) : null;
}

/**
 * Where an inbox item opens (§9.1). Push payloads carry the same `data`, so
 * this can serve both. `selfId` is the signed-in user's id (the backend uses
 * it as the self personId): an identity item about anyone else opens that
 * family member. Returns null when there is nothing specific to open.
 */
export function notificationHref(n: Pick<Notification, 'type' | 'data'>, selfId?: string | null): string | null {
  const d = n.data ?? {};
  const seg = (id: string) => encodeURIComponent(id);
  switch (notificationKind(n)) {
    case 'booking':
      return d.bookingId ? `/booking/${seg(d.bookingId)}` : null;
    case 'document':
      return d.documentId ? `/document/${seg(d.documentId)}` : null;
    case 'family':
      return d.personId ? `/family/${seg(d.personId)}` : '/family';
    case 'identity':
      return d.personId && selfId && d.personId !== selfId ? `/family/${seg(d.personId)}` : '/identity';
    case 'account':
      return '/security';
    default:
      return null;
  }
}
