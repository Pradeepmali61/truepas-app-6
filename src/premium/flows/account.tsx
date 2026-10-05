/** @jsxImportSource react */
/**
 * TRUEPAS PREMIUM — account-area flow pieces (profile, settings, security,
 * help/legal, account deletion).
 *
 * Shared primitives (ui / kit / blocks) are reused as-is; the bits here fill
 * gaps those don't cover:
 *  - SoonRow / SoonSection: approved-mockup rows with no backend, dimmed and
 *    pinned with a "Coming soon" pill that never collides with row trailing.
 *  - DateField: premium trigger + bottom-sheet calendar (port of the legacy
 *    composite DatePicker — same ISO contract, min/max, year mode).
 *  - LegalPage: LegalView layout WITHOUT LegalView's hard-coded "short
 *    version" claim, so legal screens only show their own original text.
 *  - applyPinKey: Keypad → PIN string reducer.
 *  - useSupportContact / timeAgo: server support channels and "3 days ago".
 */
import Constants from 'expo-constants';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSupportChannels } from '@/features/account/hooks';

import { ComingSoon } from '../kit';
import { C, F, R, SH } from '../theme';
import { Button, Group, ListRow, Row, TopBar, Txt } from '../ui';

/* ───────────────────────── constants ───────────────────────── */

/** Real app version (app.json → expoConfig), same source the legacy ProfileMenu used. */
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

/** Fallback only — shown while GET /support/channels loads or if it fails. */
export const SUPPORT_EMAIL = 'support@truepas.com';

/** mailto: support — swallow the rejection when no mail client is configured. */
export function emailSupport(email: string = SUPPORT_EMAIL) {
  void Linking.openURL(`mailto:${email}`).catch(() => {});
}

/** tel: support line (spaces and dashes stripped). */
export function callSupport(phone: string) {
  void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`).catch(() => {});
}

export function openSupportChat(url: string) {
  void Linking.openURL(url).catch(() => {});
}

/**
 * Support contact from the server (GET /support/channels). Null channels are
 * hidden; the email falls back to SUPPORT_EMAIL only while the call is
 * loading or failed, so there is always one way to reach us.
 */
export function useSupportContact() {
  const ch = useSupportChannels().data;
  return {
    email: ch ? ch.email : SUPPORT_EMAIL,
    phone: ch?.phone ?? null,
    chatUrl: ch?.chatUrl ?? null,
    hours: ch?.hours ?? null,
  };
}

/* ───────────────────────── time ───────────────────────── */

/**
 * "just now" · "5 minutes ago" · "3 hours ago" · "yesterday" · "4 days ago",
 * then "on 12 Mar 2026". Empty string for a missing/unparseable timestamp.
 */
export function timeAgo(iso?: string | null, now = Date.now()): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const mins = Math.max(0, Math.floor((now - t) / 60_000));
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  return `on ${new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/* ───────────────────────── coming soon ───────────────────────── */

/** A ListRow whose feature has no backend yet — dimmed, inert, pill on the right. */
export function SoonRow({
  icon,
  tone,
  title,
  sub,
}: {
  icon?: LucideIcon;
  tone?: Parameters<typeof ListRow>[0]['tone'];
  title: string;
  sub?: string;
}) {
  return (
    <View accessibilityState={{ disabled: true }} accessibilityHint="Coming soon">
      <View pointerEvents="none" style={{ opacity: 0.55 }}>
        <ListRow icon={icon} tone={tone} title={title} sub={sub} chevron={false} trailing={<View style={{ width: 96 }} />} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, justifyContent: 'center' }}>
        <ComingSoon />
      </View>
    </View>
  );
}

/** A whole grouped card that's mockup-only: title + pill, dimmed inert rows. */
export function SoonSection({ title, children }: { title: string; children: ReactNode[] | ReactNode }) {
  return (
    <View style={{ gap: 10 }} accessibilityState={{ disabled: true }} accessibilityHint="Coming soon">
      <Row between style={{ marginLeft: 4 }}>
        <Txt v="micro">{title}</Txt>
        <ComingSoon />
      </Row>
      <View pointerEvents="none" style={{ opacity: 0.55 }}>
        <Group>{children}</Group>
      </View>
    </View>
  );
}

/* ───────────────────────── PIN keypad ───────────────────────── */

/** Applies one Keypad key ("0"-"9" | "del") to a PIN string. */
export function applyPinKey(value: string, key: string, length: number): string {
  if (key === 'del') return value.slice(0, -1);
  if (!/^\d$/.test(key) || value.length >= length) return value;
  return value + key;
}

/* ───────────────────────── date field ───────────────────────── */

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const YEAR_ROW = 48;

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isIso(v?: string): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(`${v}T00:00:00`).getTime());
}

/** "YYYY-MM-DD" → localized "12 Mar 1990"; non-ISO input is shown as-is. */
export function formatIsoDate(v?: string | null): string {
  if (!v) return '';
  if (!isIso(v)) return v;
  return new Date(`${v}T00:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Premium date input. Value is an ISO "YYYY-MM-DD" string (same contract as
 * the legacy composite DatePicker it replaces). Picks into a draft and only
 * commits on Apply.
 */
export function DateField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  minDate,
  maxDate,
  hint,
  error,
  icon: Icon = CalendarDays,
}: {
  label: string;
  value?: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  hint?: string;
  error?: string;
  icon?: LucideIcon;
}) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'days' | 'years'>('days');
  const [draft, setDraft] = useState<string | undefined>(value);

  // With no value, open on today — or on maxDate when it lies in the past.
  const startDate = () => {
    if (isIso(value)) return new Date(`${value}T00:00:00`);
    const today = new Date();
    return maxDate && maxDate < toISO(today) ? new Date(`${maxDate}T00:00:00`) : today;
  };
  const [view, setView] = useState(() => {
    const s = startDate();
    return { year: s.getFullYear(), month: s.getMonth() };
  });

  const openPicker = () => {
    const s = startDate();
    setView({ year: s.getFullYear(), month: s.getMonth() });
    setDraft(isIso(value) ? value : undefined);
    setMode('days');
    setOpen(true);
  };

  const navMonth = (delta: number) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  const inRange = (iso: string) => (!minDate || iso >= minDate) && (!maxDate || iso <= maxDate);
  const firstDay = new Date(view.year, view.month, 1).getDay();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const todayISO = toISO(new Date());
  const cells: (string | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(view.year, view.month, i + 1))),
  ];

  const currentYear = new Date().getFullYear();
  const minYear = minDate ? parseInt(minDate.slice(0, 4), 10) : currentYear - 100;
  const maxYear = maxDate ? parseInt(maxDate.slice(0, 4), 10) : currentYear + 50;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  const yearOffset = Math.max(0, (Math.floor((maxYear - view.year) / 4) - 1) * YEAR_ROW);

  const shown = formatIsoDate(value);

  return (
    <View style={{ gap: 8 }}>
      <Txt v="smallStrong" color={C.ink2}>
        {label}
      </Txt>
      <Pressable onPress={openPicker} accessibilityRole="button" accessibilityLabel={`${label}${shown ? `, ${shown}` : ''}`}>
        <View
          style={{
            height: 56,
            borderRadius: R.md,
            backgroundColor: C.surface,
            borderWidth: 1.5,
            borderColor: error ? C.red : open ? C.sky : C.line,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            gap: 12,
          }}
        >
          <Icon size={19} color={open ? C.sky : C.ink3} strokeWidth={2} />
          <Text style={{ flex: 1, fontFamily: F.semibold, fontSize: 15.5, color: shown ? C.ink : C.ink4 }} numberOfLines={1}>
            {shown || placeholder}
          </Text>
          <ChevronDown size={18} color={C.ink4} />
        </View>
      </Pressable>
      {(hint != null || error != null) && (
        <Txt v="small" color={error ? C.redInk : C.ink3}>
          {error ?? hint}
        </Txt>
      )}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(1,27,39,0.45)' }} onPress={() => setOpen(false)} accessibilityLabel="Close" />
        <View
          style={[
            {
              position: 'absolute',
              left: 10,
              right: 10,
              bottom: 10 + insets.bottom,
              backgroundColor: C.surface,
              borderRadius: 32,
              padding: 20,
              gap: 14,
            },
            SH.lg,
          ]}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: C.line }} />
          <Txt v="h3">{label}</Txt>

          <Row between>
            {mode === 'years' ? (
              <Txt v="bodyStrong">Select year</Txt>
            ) : (
              <>
                <Pressable onPress={() => navMonth(-1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Previous month">
                  <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronLeft size={18} color={C.ink} />
                  </View>
                </Pressable>
                <Pressable onPress={() => setMode('years')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Choose year">
                  <Row gap={6}>
                    <Txt v="bodyStrong">
                      {MONTHS[view.month]} {view.year}
                    </Txt>
                    <ChevronDown size={16} color={C.ink3} />
                  </Row>
                </Pressable>
                <Pressable onPress={() => navMonth(1)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Next month">
                  <View style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: C.line, alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRight size={18} color={C.ink} />
                  </View>
                </Pressable>
              </>
            )}
          </Row>

          {mode === 'years' ? (
            <ScrollView style={{ maxHeight: YEAR_ROW * 6 }} contentOffset={{ x: 0, y: yearOffset }} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {years.map((y) => {
                  const selected = y === view.year;
                  return (
                    <Pressable
                      key={y}
                      onPress={() => {
                        setView({ year: y, month: view.month });
                        setMode('days');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Year ${y}`}
                      accessibilityState={{ selected }}
                      style={{ width: '25%', height: YEAR_ROW, padding: 4 }}
                    >
                      <View style={{ flex: 1, borderRadius: R.full, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? C.sky : 'transparent' }}>
                        <Text style={{ fontFamily: F.semibold, fontSize: 15, color: selected ? C.white : C.ink }}>{y}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {DAYS.map((d) => (
                <View key={d} style={{ width: `${100 / 7}%`, height: 28, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontFamily: F.semibold, fontSize: 12, color: C.ink3 }}>{d}</Text>
                </View>
              ))}
              {cells.map((iso, i) => {
                if (!iso) return <View key={`e${i}`} style={{ width: `${100 / 7}%`, height: 44 }} />;
                const selected = iso === draft;
                const out = !inRange(iso);
                const today = iso === todayISO;
                return (
                  <Pressable
                    key={iso}
                    disabled={out}
                    onPress={() => setDraft(iso)}
                    accessibilityRole="button"
                    accessibilityLabel={formatIsoDate(iso)}
                    accessibilityState={{ selected, disabled: out }}
                    style={{ width: `${100 / 7}%`, height: 44, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: selected ? C.sky : 'transparent',
                        borderWidth: !selected && today ? 1.5 : 0,
                        borderColor: C.sky,
                      }}
                    >
                      <Text style={{ fontFamily: selected ? F.bold : F.medium, fontSize: 15, color: selected ? C.white : out ? C.ink4 : C.ink }}>
                        {parseInt(iso.slice(8, 10), 10)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Row gap={10}>
            <Button label="Cancel" tone="white" size="md" style={{ flex: 1 }} onPress={() => setOpen(false)} />
            <Button
              label="Apply"
              size="md"
              style={{ flex: 1 }}
              disabled={!draft}
              onPress={() => {
                if (draft) onChange(draft);
                setOpen(false);
              }}
            />
          </Row>
        </View>
      </Modal>
    </View>
  );
}

/* ───────────────────────── legal ───────────────────────── */

export interface LegalSectionText {
  h: string;
  p: string;
}

/**
 * Long-form legal page in the LegalView look (serif headline, numbered
 * sections) — plain text only, no HTML rendering (XSS-safe, as the legacy
 * LegalDocument). Carries no summary banner of its own.
 */
export function LegalPage({
  topTitle,
  title,
  accent,
  updated,
  intro,
  sections,
  footer,
}: {
  topTitle: string;
  title: string;
  accent: string;
  updated: string;
  intro?: string;
  sections: LegalSectionText[];
  footer?: ReactNode;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: C.surface }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <TopBar title={topTitle} />
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 + 24, gap: 26 }} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12, paddingTop: 8 }}>
            <Txt v="micro" color={C.sky}>
              {updated}
            </Txt>
            <Text style={{ fontFamily: F.extrabold, fontSize: 34, letterSpacing: -1.1, lineHeight: 40, color: C.ink }}>
              {title} <Text style={{ fontFamily: F.serifItalic, fontSize: 40, color: C.sky }}>{accent}</Text>
            </Text>
            {intro != null && (
              <Txt v="body" style={{ fontSize: 16, lineHeight: 25 }}>
                {intro}
              </Txt>
            )}
          </View>
          {sections.map((s, i) => (
            <View key={s.h} style={{ gap: 10 }}>
              <Row gap={10} align="flex-start">
                <Text style={{ fontFamily: F.mono, fontSize: 12, color: C.sky, marginTop: 5 }}>{String(i + 1).padStart(2, '0')}</Text>
                <Txt v="h3" style={{ flex: 1 }}>
                  {s.h}
                </Txt>
              </Row>
              <Txt v="body" style={{ lineHeight: 24 }}>
                {s.p}
              </Txt>
            </View>
          ))}
          {footer}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
