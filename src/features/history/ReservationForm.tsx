/** @jsxImportSource react */
/**
 * Reservation form (BACKEND_UPDATE_2026-10 §8.3) — shared by
 * /booking/new (POST /bookings) and /booking/[id]/edit (PATCH, changed
 * fields only). Client checks mirror the backend's 422 rules: venue
 * required, check-in a local YYYY-MM-DD not in the past ("today" is fine),
 * check-out on or after check-in, 1–100 guests, notes up to 500 characters.
 * Server field errors land on their fields; anything else (409
 * RESERVATION_LIMIT, 404 member) shows in the banner. Check-in itself only
 * ever happens at the venue kiosk.
 */
import { Building2, Check, MapPin, Minus, Plus, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View, type TextStyle } from 'react-native';

import { toApiError } from '@/api/errors';
import { BOOKING_KINDS, KIND_META, bookingKind, isoDay } from '@/premium/flows/home';
import { DateField } from '@/premium/flows/family';
import { Banner } from '@/premium/kit';
import { C, F, R } from '@/premium/theme';
import { Button, Chip, Field, Heading, Row, Screen, TextLink, TopBar, Txt } from '@/premium/ui';
import type { Booking, BookingKind, CreateReservationRequest, FamilyMember, UpdateReservationRequest } from '@/types/domain';

export const NOTES_MAX = 500;
const GUESTS_MIN = 1;
const GUESTS_MAX = 100;

export interface ReservationDraft {
  venue: string;
  location: string;
  kind: BookingKind;
  checkIn: string;
  checkOut: string;
  guests: number;
  memberIds: string[];
  notes: string;
}

type FieldKey = keyof ReservationDraft;
type Errors = Partial<Record<FieldKey, string>>;

export const EMPTY_DRAFT: ReservationDraft = {
  venue: '',
  location: '',
  kind: 'other',
  checkIn: '',
  checkOut: '',
  guests: 1,
  memberIds: [],
  notes: '',
};

/** Who's going on an existing reservation. The Booking payload has no
 *  `memberIds` in the documented shape; use it when the server sends it,
 *  else the person ids in checkedInMembers that are family members. */
export function knownMemberIds(b: Booking, family: FamilyMember[]): string[] {
  const sent = (b as Booking & { memberIds?: unknown }).memberIds;
  if (Array.isArray(sent)) return sent.filter((x): x is string => typeof x === 'string');
  const ids = new Set(family.map((m) => m.id));
  return (b.checkedInMembers ?? []).filter((x) => ids.has(x));
}

/** False when the payload says nothing about who's going (no memberIds and
 *  no family ids in checkedInMembers) — the form then can't show it. */
export function membersKnown(b: Booking, family: FamilyMember[]): boolean {
  return Array.isArray((b as Booking & { memberIds?: unknown }).memberIds) || knownMemberIds(b, family).length > 0;
}

export function draftFromBooking(b: Booking, family: FamilyMember[]): ReservationDraft {
  return {
    venue: b.venue ?? '',
    location: b.location ?? '',
    kind: bookingKind(b),
    checkIn: (b.checkIn ?? '').slice(0, 10),
    checkOut: (b.checkOut ?? '').slice(0, 10),
    guests: b.guests >= GUESTS_MIN ? b.guests : GUESTS_MIN,
    memberIds: knownMemberIds(b, family),
    notes: b.notes ?? '',
  };
}

/** Same rules as the backend. An unchanged check-in day is not re-checked:
 *  a stay that started yesterday is still an editable upcoming reservation. */
function validate(d: ReservationDraft, original?: ReservationDraft): Errors {
  const e: Errors = {};
  if (!d.venue.trim()) e.venue = 'Enter the venue name';
  if (!d.checkIn) e.checkIn = 'Pick the check-in date';
  else if (d.checkIn < isoDay() && d.checkIn !== original?.checkIn) e.checkIn = "Check-in can't be in the past";
  if (d.checkOut && d.checkIn && d.checkOut < d.checkIn) e.checkOut = 'Check-out must be on or after check-in';
  if (!Number.isInteger(d.guests) || d.guests < GUESTS_MIN || d.guests > GUESTS_MAX) e.guests = 'Guests must be between 1 and 100';
  if (d.notes.trim().length > NOTES_MAX) e.notes = `Notes can be up to ${NOTES_MAX} characters`;
  return e;
}

function toCreate(d: ReservationDraft): CreateReservationRequest {
  const p: CreateReservationRequest = { venue: d.venue.trim(), kind: d.kind, checkIn: d.checkIn, guests: d.guests };
  if (d.location.trim()) p.location = d.location.trim();
  if (d.checkOut) p.checkOut = d.checkOut;
  if (d.memberIds.length > 0) p.memberIds = d.memberIds;
  if (d.notes.trim()) p.notes = d.notes.trim();
  return p;
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));

/** Only what changed (PATCH accepts any subset). */
function toPatch(d: ReservationDraft, o: ReservationDraft): UpdateReservationRequest {
  const p: UpdateReservationRequest = {};
  if (d.venue.trim() !== o.venue.trim()) p.venue = d.venue.trim();
  if (d.location.trim() !== o.location.trim()) p.location = d.location.trim();
  if (d.kind !== o.kind) p.kind = d.kind;
  if (d.checkIn !== o.checkIn) p.checkIn = d.checkIn;
  if (d.checkOut && d.checkOut !== o.checkOut) p.checkOut = d.checkOut;
  if (d.guests !== o.guests) p.guests = d.guests;
  if (!sameSet(d.memberIds, o.memberIds)) p.memberIds = d.memberIds;
  if (d.notes.trim() !== o.notes.trim()) p.notes = d.notes.trim();
  return p;
}

/** 422 field names (camelCase or snake_case) → form fields. */
const FIELD_OF: Record<string, FieldKey> = {
  venue: 'venue',
  location: 'location',
  kind: 'kind',
  checkIn: 'checkIn',
  check_in: 'checkIn',
  checkOut: 'checkOut',
  check_out: 'checkOut',
  guests: 'guests',
  memberIds: 'memberIds',
  member_ids: 'memberIds',
  notes: 'notes',
};

export type SubmitResult = { ok: true } | { ok: false; error: unknown };

export function ReservationForm({
  mode,
  initial,
  family,
  saving,
  onCreate,
  onUpdate,
  membersUnknown,
}: {
  mode: 'create' | 'edit';
  initial: ReservationDraft;
  family: FamilyMember[];
  saving: boolean;
  onCreate?: (payload: CreateReservationRequest) => Promise<SubmitResult>;
  /** Called with an empty patch when nothing changed. */
  onUpdate?: (patch: UpdateReservationRequest) => Promise<SubmitResult>;
  /** Editing a booking whose payload doesn't list who's going: untouched
   *  chips are not sent, so the server keeps its list. */
  membersUnknown?: boolean;
}) {
  const [d, setD] = useState<ReservationDraft>(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const editing = mode === 'edit';

  const set = <K extends FieldKey>(k: K, v: ReservationDraft[K]) => {
    setD((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: undefined }));
  };

  const toggleMember = (id: string) =>
    set('memberIds', d.memberIds.includes(id) ? d.memberIds.filter((x) => x !== id) : [...d.memberIds, id]);

  const submit = async () => {
    setBanner(null);
    const next = validate(d, editing ? initial : undefined);
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = editing ? await onUpdate?.(toPatch(d, initial)) : await onCreate?.(toCreate(d));
    if (!result || result.ok) return;

    const err = toApiError(result.error);
    const fieldErrors: Errors = {};
    const loose: string[] = [];
    for (const [k, msg] of Object.entries(err.fieldErrors ?? {})) {
      const f = FIELD_OF[k];
      if (f) fieldErrors[f] = msg;
      else if (msg) loose.push(msg);
    }
    setErrors(fieldErrors);
    const mapped = Object.keys(fieldErrors).length > 0;
    setBanner(loose.length > 0 ? loose.join('\n') : mapped ? null : err.message);
  };

  // Clearing an existing check-out isn't in the PATCH contract (string only).
  const canClearCheckOut = !!d.checkOut && !(editing && initial.checkOut);
  const today = isoDay();

  return (
    <Screen
      keyboard
      header={<TopBar title={editing ? 'Edit reservation' : 'Add reservation'} />}
      contentStyle={{ paddingTop: 8, gap: 24 }}
      footer={
        <Button
          label={editing ? 'Save changes' : 'Save reservation'}
          icon={Check}
          loading={saving}
          disabled={saving}
          onPress={() => void submit()}
        />
      }
    >
      <Heading
        title={editing ? 'Edit your' : 'Add a'}
        accent="reservation"
        sub="Keep your plans in one place. You still check in at the venue kiosk."
      />

      {banner != null && <Banner tone="error" title={editing ? "Couldn't save changes" : "Couldn't add the reservation"} body={banner} />}

      <View style={{ gap: 18 }}>
        <Field
          label="Venue"
          icon={Building2}
          placeholder="e.g. Taj Lands End"
          value={d.venue}
          onChangeText={(t) => set('venue', t)}
          error={errors.venue}
          inputProps={{ autoCapitalize: 'words', maxLength: 120, autoComplete: 'off' }}
        />
        <Field
          label="Location (optional)"
          icon={MapPin}
          placeholder="City"
          value={d.location}
          onChangeText={(t) => set('location', t)}
          error={errors.location}
          inputProps={{ autoCapitalize: 'words', maxLength: 120, autoComplete: 'off' }}
        />
      </View>

      <View style={{ gap: 10 }}>
        <Txt v="smallStrong" color={C.ink2}>
          Type
        </Txt>
        <Row gap={8} style={{ flexWrap: 'wrap' }}>
          {BOOKING_KINDS.map((k) => (
            <Chip key={k} label={KIND_META[k].label} icon={KIND_META[k].icon} active={d.kind === k} onPress={() => set('kind', k)} />
          ))}
        </Row>
        {!!errors.kind && (
          <Txt v="small" color={C.redInk}>
            {errors.kind}
          </Txt>
        )}
      </View>

      <View style={{ gap: 18 }}>
        <DateField
          label="Check-in"
          value={d.checkIn || undefined}
          onChange={(iso) => {
            set('checkIn', iso);
            if (d.checkOut && d.checkOut < iso) set('checkOut', '');
          }}
          placeholder="Select date"
          minDate={today}
          error={errors.checkIn}
        />
        <View>
          <DateField
            label="Check-out (optional)"
            value={d.checkOut || undefined}
            onChange={(iso) => set('checkOut', iso)}
            placeholder="Select date"
            minDate={d.checkIn && d.checkIn > today ? d.checkIn : today}
            error={errors.checkOut}
          />
          {canClearCheckOut && (
            <View style={{ position: 'absolute', right: 2, top: 0 }}>
              <TextLink label="Clear" onPress={() => set('checkOut', '')} />
            </View>
          )}
        </View>
      </View>

      <GuestStepper value={d.guests} onChange={(n) => set('guests', n)} error={errors.guests} />

      {family.length > 0 && (
        <View style={{ gap: 10 }}>
          <Txt v="smallStrong" color={C.ink2}>
            {"Who's going (optional)"}
          </Txt>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {family.map((m) => {
              const on = d.memberIds.includes(m.id);
              return (
                <Chip key={m.id} label={m.name.split(' ')[0]} icon={on ? Check : UserRound} active={on} onPress={() => toggleMember(m.id)} />
              );
            })}
          </Row>
          {errors.memberIds ? (
            <Txt v="small" color={C.redInk}>
              {errors.memberIds}
            </Txt>
          ) : (
            <Txt v="small">
              {membersUnknown && sameSet(d.memberIds, initial.memberIds)
                ? "Leave as is to keep who's going unchanged."
                : 'Family members on this booking.'}
            </Txt>
          )}
        </View>
      )}

      <NotesField value={d.notes} onChange={(t) => set('notes', t)} error={errors.notes} />
    </Screen>
  );
}

/* ───────────────────────── pieces ───────────────────────── */

function StepButton({ icon: Icon, label, disabled, onPress }: { icon: typeof Plus; label: string; disabled: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} hitSlop={6}>
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: disabled ? C.sunken : C.skyWash,
        }}
      >
        <Icon size={18} color={disabled ? C.ink4 : C.skyPressed} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

function GuestStepper({ value, onChange, error }: { value: number; onChange: (n: number) => void; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Txt v="smallStrong" color={C.ink2}>
        Guests
      </Txt>
      <View
        accessible={false}
        style={{
          height: 56,
          borderRadius: R.md,
          backgroundColor: C.surface,
          borderWidth: 1.5,
          borderColor: error ? C.red : C.line,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 8,
        }}
      >
        <StepButton icon={Minus} label="Fewer guests" disabled={value <= GUESTS_MIN} onPress={() => onChange(Math.max(GUESTS_MIN, value - 1))} />
        <Text
          accessibilityLabel={`${value} ${value === 1 ? 'guest' : 'guests'}`}
          style={{ fontFamily: F.bold, fontSize: 18, color: C.ink }}
        >
          {value}
        </Text>
        <StepButton icon={Plus} label="More guests" disabled={value >= GUESTS_MAX} onPress={() => onChange(Math.min(GUESTS_MAX, value + 1))} />
      </View>
      <Txt v="small" color={error ? C.redInk : C.ink3}>
        {error ?? 'Including you.'}
      </Txt>
    </View>
  );
}

function NotesField({ value, onChange, error }: { value: string; onChange: (t: string) => void; error?: string }) {
  const [focus, setFocus] = useState(false);
  const over = value.trim().length > NOTES_MAX;
  return (
    <View style={{ gap: 8 }}>
      <Row between>
        <Txt v="smallStrong" color={C.ink2}>
          Notes (optional)
        </Txt>
        <Txt v="small" color={over ? C.redInk : C.ink4}>
          {value.length}/{NOTES_MAX}
        </Txt>
      </Row>
      <View
        style={[
          {
            minHeight: 112,
            borderRadius: R.md,
            backgroundColor: C.surface,
            borderWidth: 1.5,
            borderColor: error ? C.red : focus ? C.sky : C.line,
            paddingHorizontal: 16,
            paddingVertical: 12,
          },
          focus && !error && { boxShadow: '0px 0px 0px 4px rgba(8,182,252,0.14)' },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          multiline
          maxLength={NOTES_MAX}
          placeholder="e.g. Room booked via travel agent"
          placeholderTextColor={C.ink4}
          accessibilityLabel="Notes"
          textAlignVertical="top"
          style={{ minHeight: 88, fontFamily: F.semibold, fontSize: 15, lineHeight: 21, color: C.ink, outlineStyle: 'none' } as unknown as TextStyle}
        />
      </View>
      {!!error && (
        <Txt v="small" color={C.redInk}>
          {error}
        </Txt>
      )}
    </View>
  );
}
