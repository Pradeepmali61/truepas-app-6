/** @jsxImportSource react */
/**
 * TRUEPAS PREMIUM — main-tab flow pieces backed by REAL data:
 * Booking → journey hero / carousel card / list row adapters, the wallet
 * document card, the contract-status badge and the Home profile drawer.
 *
 * Shared premium primitives (ui / kit / blocks) are reused as-is; the bits
 * here exist because blocks.tsx's Trip / Doc shapes are showcase-only (bundled
 * photos, invented fields) and don't fit the API types.
 */
import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
  BedDouble,
  CalendarDays,
  FerrisWheel,
  LogOut,
  type LucideIcon,
  Mail,
  MapPin,
  Palette,
  Pencil,
  Phone,
  Plane,
  ScanFace,
  ShieldCheck,
  Ship,
  Ticket,
  Trash2,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLogoutFlow } from '@/features/auth/useLogoutFlow';
import { useProfilePicture } from '@/features/profile/hooks';
import { Guilloche } from '@/premium/blocks';
import { IMG, type ImgKey } from '@/premium/images';
import { ComingSoon, ConfirmSheet } from '@/premium/kit';
import { C, F, G, R, SH } from '@/premium/theme';
import { Avatar, Badge, type BadgeTone, Card, Group, IconCircle, ListRow, Press, Row, Txt } from '@/premium/ui';
import { useAppSelector } from '@/store';
import type { Booking, DocumentType, IdentityDocument } from '@/types/domain';

/* ───────────────────────── formatting ───────────────────────── */

/** ISO or date-only → Date. Date-only strings are pinned to midday so they
 *  don't slip a day in negative-UTC time zones (design-repo formatCheckIn). */
function toDate(iso: string): Date {
  if (!iso) return new Date(NaN);
  return new Date(iso.includes('T') ? iso : `${iso}T12:00:00`);
}

/** "Jul 21, 2026" — falls back to the raw string when unparsable. */
export function fmtDate(iso: string): string {
  const d = toDate(iso);
  return Number.isNaN(d.getTime())
    ? iso || '—'
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** "Thu, 2 Oct" */
export function fmtDay(iso: string): string {
  const d = toDate(iso);
  return Number.isNaN(d.getTime())
    ? iso || '—'
    : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function dayDiff(iso: string): number | null {
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return null;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return Math.round((startOf(d) - startOf(new Date())) / 86_400_000);
}

/** "Today" / "Tomorrow" / "Thu, 2 Oct". */
export function whenLabel(iso: string): string {
  const diff = dayDiff(iso);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return fmtDay(iso);
}

export function isTodayIso(iso: string): boolean {
  return dayDiff(iso) === 0;
}

/** Booking amount — same rendering as the original BookingCard. */
export function money(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "May 2032" — for document expiry. */
export function fmtMonthYear(iso: string): string {
  const d = toDate(iso);
  return Number.isNaN(d.getTime()) ? iso || '—' : d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

/** "September" (this year) / "September 2025" — list grouping headers. */
export function fmtMonthLabel(iso: string): string {
  const d = toDate(iso);
  if (Number.isNaN(d.getTime())) return 'Earlier';
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, sameYear ? { month: 'long' } : { month: 'long', year: 'numeric' });
}

export function yearOf(iso: string): number | null {
  const d = toDate(iso);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

/** Match score → whole percent. The API has sent both 0–1 and 0–100. */
export function matchPct(score: number): number {
  return Math.round(score <= 1 ? score * 100 : score);
}

export function greeting(now = new Date()): string {
  const h = now.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* ───────────────────────── status badges ───────────────────────── */

/** Contract status → premium badge. Same tone + copy table as the app's
 *  StatusChip so wording stays identical across screens. */
const STATUS: Record<string, [BadgeTone, string]> = {
  verified: ['green', 'Verified'],
  approved: ['green', 'Approved'],
  completed: ['green', 'Completed'],
  active: ['green', 'Active'],
  upcoming: ['sky', 'Upcoming'],
  pending: ['amber', 'Pending'],
  pending_document: ['amber', 'Document needed'],
  pending_liveness: ['amber', 'Liveness needed'],
  review: ['amber', 'In review'],
  missing: ['neutral', 'Not added yet'],
  incomplete: ['neutral', 'Incomplete'],
  failed: ['red', 'Failed'],
  rejected: ['red', 'Rejected'],
  cancelled: ['neutral', 'Cancelled'],
  expired: ['red', 'Expired'],
};

export function statusTone(status: string): BadgeTone {
  return STATUS[status.toLowerCase()]?.[0] ?? 'neutral';
}

export function statusLabel(status: string): string {
  return STATUS[status.toLowerCase()]?.[1] ?? status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}

export function StatusBadge({ status, dot }: { status: string; dot?: boolean }) {
  return <Badge label={statusLabel(status)} tone={statusTone(status)} dot={dot} />;
}

/** Tile tone for a verification status (check rows). */
export function statusTileTone(status: string): 'green' | 'amber' | 'red' | 'neutral' {
  const t = statusTone(status);
  return t === 'green' || t === 'amber' || t === 'red' ? t : 'neutral';
}

/* ───────────────────────── bookings ───────────────────────── */

type BookingKind = 'hotel' | 'event' | 'flight' | 'park' | 'cruise' | 'other';

/** Booking.type is a free string ("hotel", "Hotel", "Theme Park"…) — match
 *  loosely, never invent a kind the API didn't send. */
export function bookingKind(type: string): BookingKind {
  const t = (type ?? '').toLowerCase();
  if (t.includes('hotel')) return 'hotel';
  if (t.includes('flight')) return 'flight';
  if (t.includes('event')) return 'event';
  if (t.includes('park')) return 'park';
  if (t.includes('cruise')) return 'cruise';
  return 'other';
}

const KIND_META: Record<BookingKind, { icon: LucideIcon; photo: ImgKey | null }> = {
  hotel: { icon: BedDouble, photo: 'hotelDusk' },
  event: { icon: Ticket, photo: 'concert' },
  flight: { icon: Plane, photo: 'flight' },
  park: { icon: FerrisWheel, photo: 'themepark' },
  cruise: { icon: Ship, photo: 'cruise' },
  other: { icon: CalendarDays, photo: null },
};

export function bookingIcon(type: string): LucideIcon {
  return KIND_META[bookingKind(type)].icon;
}

/** Icon for a booking type as an element (avoids creating components in render). */
export function BookingTypeIcon({ type, size = 16, color = C.ink }: { type: string; size?: number; color?: string }) {
  const meta = KIND_META[bookingKind(type)];
  const Icon = meta.icon;
  return <Icon size={size} color={color} />;
}

/** The API's own type string, capitalised ("theme park" → "Theme park"). */
export function bookingTypeLabel(type: string): string {
  const t = (type ?? '').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : 'Booking';
}

const isUrl = (s?: string | null): s is string => !!s && /^https?:\/\//.test(s);

/**
 * Venue imagery: the booking's own photo when the API sends a URL; otherwise
 * a category photo for known kinds; otherwise a navy gradient + icon.
 */
export function BookingBackdrop({ b, iconSize = 44 }: { b: Booking; iconSize?: number }) {
  const meta = KIND_META[bookingKind(b.type)];
  if (isUrl(b.image)) {
    return <Image source={{ uri: b.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />;
  }
  if (meta.photo) {
    return <Image source={IMG[meta.photo]} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />;
  }
  const Icon = meta.icon;
  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      <LinearGradient colors={G.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Guilloche size={320} opacity={0.08} style={{ right: -140, top: -140 }} />
      <Icon size={iconSize} color="rgba(255,255,255,0.35)" strokeWidth={1.6} />
    </View>
  );
}

function GlassChip({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 30,
        paddingHorizontal: 12,
        borderRadius: R.full,
        backgroundColor: 'rgba(10,30,42,0.42)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.22)',
        alignSelf: 'flex-start',
      }}
    >
      <Icon size={14} color={C.white} strokeWidth={2.2} />
      <Text style={{ fontFamily: F.semibold, fontSize: 12.5, color: C.white }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function checkedIn(b: Booking) {
  const n = (b.checkedInMembers ?? []).length;
  return { n, progress: Math.min(1, n / Math.max(b.guests, 1)) };
}

/** Hero journey for the next upcoming booking (Home "Today" / "Next"). */
export function BookingHero({ b, onPress, cta }: { b: Booking; onPress?: () => void; cta?: ReactNode }) {
  const Icon = bookingIcon(b.type);
  const { n, progress } = checkedIn(b);
  return (
    <Press
      onPress={onPress}
      scaleTo={0.985}
      label={`Next check-in at ${b.venue}, ${b.location}`}
      // No button role when the card hosts its own action: on web a role=button
      // renders <button>, and a nested <button> is invalid HTML.
      role={cta ? undefined : 'button'}
      style={[{ borderRadius: R.xxl }, SH.lg]}
    >
      <View style={{ minHeight: 420, borderRadius: R.xxl, overflow: 'hidden', justifyContent: 'space-between', padding: 18, gap: 24 }}>
        <BookingBackdrop b={b} iconSize={64} />
        <LinearGradient colors={G.photoFade} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        <Row between>
          <GlassChip icon={Icon} label={bookingTypeLabel(b.type)} />
          <StatusBadge status={b.status} dot />
        </Row>
        <View style={{ gap: 14 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 13, color: C.skyLight }}>{whenLabel(b.checkIn)}</Text>
            <Text style={{ fontFamily: F.extrabold, fontSize: 30, letterSpacing: -0.9, color: C.white }} numberOfLines={2}>
              {b.venue}
            </Text>
            <Row gap={6}>
              <MapPin size={14} color="rgba(255,255,255,0.78)" />
              <Text style={{ fontFamily: F.medium, fontSize: 14, color: 'rgba(255,255,255,0.78)', flexShrink: 1 }} numberOfLines={1}>
                {b.location}
              </Text>
            </Row>
          </View>
          <View
            style={{
              borderRadius: R.lg,
              padding: 14,
              gap: 12,
              backgroundColor: 'rgba(10,30,42,0.42)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.16)',
            }}
          >
            <Row between>
              <GlassFact k="Check-in" v={fmtDate(b.checkIn)} />
              <GlassFact k="Guests" v={String(b.guests)} />
              <GlassFact k="Total" v={money(b.amount)} end />
            </Row>
            <View style={{ gap: 6 }}>
              <Row between>
                <Text style={{ fontFamily: F.medium, fontSize: 12, color: 'rgba(255,255,255,0.65)' }}>Checked in</Text>
                <Text style={{ fontFamily: F.mono, fontSize: 13, color: C.white }}>
                  {n}/{b.guests}
                </Text>
              </Row>
              <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' }}>
                <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 3, backgroundColor: C.sky }} />
              </View>
            </View>
          </View>
          {cta}
        </View>
      </View>
    </Press>
  );
}

function GlassFact({ k, v, end }: { k: string; v: string; end?: boolean }) {
  return (
    <View style={{ gap: 2, alignItems: end ? 'flex-end' : 'flex-start', flexShrink: 1 }}>
      <Text style={{ fontFamily: F.medium, fontSize: 11.5, color: 'rgba(255,255,255,0.6)' }}>{k}</Text>
      <Text style={{ fontFamily: F.mono, fontSize: 13, color: C.white }} numberOfLines={1}>
        {v}
      </Text>
    </View>
  );
}

/** Horizontal carousel card for further upcoming bookings. */
export function BookingCarouselCard({ b, onPress, width = 248 }: { b: Booking; onPress?: () => void; width?: number }) {
  const Icon = bookingIcon(b.type);
  return (
    <Press onPress={onPress} label={`${b.venue}, ${b.location}`} role="button" style={[{ width, borderRadius: R.xl }, SH.md]}>
      <View style={{ borderRadius: R.xl, overflow: 'hidden', backgroundColor: C.surface }}>
        <View style={{ height: 150 }}>
          <BookingBackdrop b={b} />
          <View style={{ position: 'absolute', left: 12, top: 12 }}>
            <GlassChip icon={Icon} label={bookingTypeLabel(b.type)} />
          </View>
        </View>
        <View style={{ padding: 14, gap: 3 }}>
          <Txt v="small" color={C.skyPressed} style={{ fontFamily: F.semibold }}>
            {whenLabel(b.checkIn)}
          </Txt>
          <Txt v="h3" lines={1}>
            {b.venue}
          </Txt>
          <Txt v="small" lines={1}>
            {b.location}
          </Txt>
          <Txt v="small" color={C.ink4} lines={1}>
            {b.guests} {b.guests === 1 ? 'guest' : 'guests'} · {money(b.amount)}
          </Txt>
        </View>
      </View>
    </Press>
  );
}

/** Compact list row with thumbnail — history lists. */
export function BookingRow({ b, onPress }: { b: Booking; onPress?: () => void }) {
  const { n } = checkedIn(b);
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${b.venue}, ${b.location}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 }}>
        <View style={{ width: 62, height: 62, borderRadius: 16, overflow: 'hidden' }}>
          <BookingBackdrop b={b} iconSize={22} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Txt v="bodyStrong" lines={1}>
            {b.venue}
          </Txt>
          <Txt v="small" lines={1}>
            {bookingTypeLabel(b.type)} · {b.location}
          </Txt>
          <Txt v="small" color={C.ink4} lines={1}>
            {fmtDate(b.checkIn)} · {n}/{b.guests} checked in
          </Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 6 }}>
          <StatusBadge status={b.status} />
          <Text style={{ fontFamily: F.mono, fontSize: 12, color: C.ink3 }}>{money(b.amount)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ───────────────────────── coming-soon helpers ───────────────────────── */

/** A dimmed, non-interactive action with a "Coming soon" tag on its edge —
 *  for approved-design CTAs that have no backend yet. */
export function SoonAction({ children, light, style }: { children: ReactNode; light?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style} accessibilityState={{ disabled: true }} accessibilityHint="Coming soon">
      <View pointerEvents="none" style={{ opacity: 0.55 }}>
        {children}
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', top: -11, right: 14 }}>
        <ComingSoon light={light} />
      </View>
    </View>
  );
}

/* ───────────────────────── wallet documents ───────────────────────── */

export const DOC_STYLE: Record<DocumentType, { title: string; colors: readonly [string, string] }> = {
  passport: { title: 'Passport', colors: ['#0B3A5B', '#021B2B'] },
  idCard: { title: 'ID card', colors: ['#08B6FC', '#0574A8'] },
  drivingLicense: { title: "Driver's license", colors: ['#3A4A57', '#1A252E'] },
  greenCard: { title: 'US Green Card', colors: ['#0F5E6E', '#06323B'] },
  birthCertificate: { title: 'Birth certificate', colors: ['#5A6B78', '#34424D'] },
  usVisa: { title: 'U.S. Visa', colors: ['#2B3F73', '#141F3D'] },
};

const DOC_FALLBACK = { title: 'Document', colors: ['#5A6B78', '#34424D'] as const };

export function docStyle(type: string) {
  return DOC_STYLE[type as DocumentType] ?? DOC_FALLBACK;
}

/** Height of the part of a wallet card that stays visible when stacked. */
export const WALLET_PEEK = 104;
export const WALLET_CARD_H = 204;

function walletBadge(status: string) {
  if (status === 'verified') return <Badge label="Verified" tone="glass" icon={ScanFace} />;
  return <Badge label={statusLabel(status)} tone={statusTone(status) === 'green' ? 'glass' : statusTone(status)} dot />;
}

/** Real IdentityDocument as a wallet card (fanned-stack look). The top
 *  WALLET_PEEK px carry title, number, expiry, status and match score so
 *  every card stays readable when stacked. */
export function WalletCard({ d, onPress, style }: { d: IdentityDocument; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  const s = docStyle(d.type);
  const issuer = (d.issuingState ?? s.title).toUpperCase();
  const expiry = d.expiresAt ? `Exp. ${fmtMonthYear(d.expiresAt)}` : 'No expiry';
  return (
    <Press onPress={onPress} scaleTo={0.985} label={`${d.label}, ${statusLabel(d.status)}`} role="button" style={[{ borderRadius: R.xl }, SH.md, style]}>
      <View style={{ height: WALLET_CARD_H, borderRadius: R.xl, overflow: 'hidden', padding: 20, justifyContent: 'space-between' }}>
        <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Guilloche size={340} opacity={0.08} style={{ right: -150, top: -150 }} />
        <Row between align="flex-start" gap={10}>
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={{ fontFamily: F.semibold, fontSize: 11, letterSpacing: 1.3, color: 'rgba(255,255,255,0.6)' }} numberOfLines={1}>
              {issuer}
            </Text>
            <Text style={{ fontFamily: F.bold, fontSize: 20, letterSpacing: -0.4, color: C.white }} numberOfLines={1}>
              {d.label}
            </Text>
            <Text style={{ fontFamily: F.mono, fontSize: 12.5, letterSpacing: 1, color: 'rgba(255,255,255,0.72)' }} numberOfLines={1}>
              {d.number} · {expiry}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            {walletBadge(d.status)}
            {d.matchScore != null && (
              <Text style={{ fontFamily: F.semibold, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{matchPct(d.matchScore)}% match</Text>
            )}
          </View>
        </Row>
        <Row between align="flex-end">
          <View style={{ gap: 4, flex: 1 }}>
            {!!d.extractedName && (
              <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.white }} numberOfLines={1}>
                {d.extractedName}
              </Text>
            )}
            <Text style={{ fontFamily: F.medium, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Added {fmtDate(d.addedAt)}</Text>
          </View>
          <Chip3D />
        </Row>
      </View>
    </Press>
  );
}

function Chip3D() {
  return (
    <View style={{ width: 40, height: 30, borderRadius: 7, overflow: 'hidden' }}>
      <LinearGradient colors={['#E9F7FF', '#9FD9F5', '#F3E6C4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(10,30,42,0.2)' }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 14, height: 1, backgroundColor: 'rgba(10,30,42,0.2)' }} />
    </View>
  );
}

/* ───────────────────────── profile drawer ───────────────────────── */

/**
 * Right-edge slide-out opened from the Home avatar — account card plus the
 * same menu the original ProfileDrawer/ProfileMenu offered: Edit profile,
 * Security & sign-in, Appearance, Sign out (confirm → useLogoutFlow) and
 * Delete account, with the app version footer.
 */
export function ProfileDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const { url: avatarUri } = useProfilePicture();
  const { logout, isPending: signingOut } = useLogoutFlow();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const { width: winW } = useWindowDimensions();
  const panelW = Math.min(340, Math.round(winW * 0.85));

  const [shown, setShown] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  const [prevVisible, setPrevVisible] = useState(visible);
  if (visible !== prevVisible) {
    setPrevVisible(visible);
    if (visible) setShown(true);
  }

  // The open animation must start from the Modal's onShow: on native
  // (Fabric) a native-driver animation kicked off in the same commit that
  // mounts the Modal is lost, leaving an invisible scrim over the screen and
  // the panel parked off-screen — the avatar tap looked dead.
  const modalReady = useRef(false);
  const animateTo = (toValue: number, done?: () => void) =>
    Animated.timing(progress, {
      toValue,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) done?.();
    });

  useEffect(() => {
    if (visible) {
      // Re-opened while the close animation was still running — the Modal
      // never unmounted, so onShow won't fire again.
      if (modalReady.current) animateTo(1);
      return;
    }
    animateTo(0, () => {
      modalReady.current = false;
      setShown(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animateTo only closes over the stable `progress`
  }, [visible]);

  if (!shown || !user) return null;

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [panelW, 0] });
  const go = (href: string) => {
    onClose();
    router.push(href as never);
  };

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      onShow={() => {
        modalReady.current = true;
        if (visible) animateTo(1);
      }}
    >
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(1,27,39,0.45)', opacity: progress }]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close menu" />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            {
              position: 'absolute',
              top: 0,
              bottom: 0,
              right: 0,
              width: panelW,
              backgroundColor: C.canvas,
              borderTopLeftRadius: R.xxl,
              borderBottomLeftRadius: R.xxl,
              paddingHorizontal: 18,
              paddingTop: insets.top + 8,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX }],
            },
            SH.lg,
          ]}
        >
          <Row between style={{ paddingVertical: 8 }}>
            <Txt v="h2">Profile</Txt>
            <IconCircle icon={X} label="Close" onPress={onClose} />
          </Row>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 22, paddingTop: 10, paddingBottom: 16 }}>
            <Card style={{ gap: 14 }}>
              <Row gap={14}>
                <Avatar uri={avatarUri} name={user.fullName} size={56} status={user.faceEnrolled ? 'verified' : 'pending'} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Txt v="h3" lines={1}>
                    {user.fullName}
                  </Txt>
                  <StatusBadge status={user.faceEnrolled ? 'verified' : 'missing'} />
                </View>
              </Row>
              <Row gap={10}>
                <Mail size={16} color={C.ink3} />
                <Txt v="body" lines={1} style={{ flex: 1 }}>
                  {user.email}
                </Txt>
              </Row>
              <Row gap={10}>
                <Phone size={16} color={C.ink3} />
                <Txt v="body" lines={1} style={{ flex: 1 }}>
                  {user.phone}
                </Txt>
              </Row>
            </Card>

            <Group title="Account">
              <ListRow icon={Pencil} tone="sky" title="Edit profile" onPress={() => go('/profile/edit')} />
              <ListRow icon={ShieldCheck} tone="sky" title="Security & sign-in" onPress={() => go('/security')} />
              <ListRow icon={Palette} tone="sky" title="Appearance" onPress={() => go('/settings')} />
              <ListRow icon={LogOut} tone="sky" title="Sign out" onPress={() => setConfirmSignOut(true)} />
            </Group>

            <Group title="Data">
              <ListRow icon={Trash2} danger title="Delete account" onPress={() => go('/account/delete')} />
            </Group>

            <Txt v="small" color={C.ink4} center>
              Truepas {Constants.expoConfig?.version ?? '1.0.0'}
            </Txt>
          </ScrollView>
        </Animated.View>
      </View>

      <ConfirmSheet
        visible={confirmSignOut}
        icon={LogOut}
        danger
        title="Sign out of Truepas?"
        confirmLabel="Sign out"
        loading={signingOut}
        onConfirm={() => void logout()}
        onCancel={() => setConfirmSignOut(false)}
      />
    </Modal>
  );
}

/* ───────────────────────── misc ───────────────────────── */

/** Big page title used by the tab roots (Check-ins, Wallet). */
export function TabTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <Row between>
      <Text style={{ fontFamily: F.extrabold, fontSize: 34, letterSpacing: -1.1, color: C.ink }}>{children}</Text>
      {right}
    </Row>
  );
}

/** Two-column fact (label over value) used on booking detail. */
export function Fact({ k, v, sub, children }: { k: string; v?: string; sub?: string; children?: ReactNode }) {
  return (
    <View style={{ flex: 1, gap: 3 }}>
      <Txt v="small">{k}</Txt>
      {children ?? <Txt v="h3">{v}</Txt>}
      {sub != null && <Txt v="small">{sub}</Txt>}
    </View>
  );
}

