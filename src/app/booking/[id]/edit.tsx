/** @jsxImportSource react */
/**
 * Edit reservation — PATCH /cb/bookings/{id} with only the changed fields
 * (BACKEND_UPDATE_2026-10 §8.3). Only the customer's own upcoming
 * reservations are editable; a 409 BOOKING_NOT_EDITABLE (it was completed
 * by a kiosk check-in or its dates passed meanwhile) shows a toast,
 * refetches and closes the form.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CalendarDays, CalendarX } from 'lucide-react-native';
import { useState } from 'react';

import { toApiError } from '@/api/errors';
import { useToast } from '@/components/composite/Toast';
import { useFamily } from '@/features/family/hooks';
import { historyKeys, isEditableReservation, useBooking, useUpdateReservation } from '@/features/history/hooks';
import { draftFromBooking, membersKnown, ReservationForm } from '@/features/history/ReservationForm';
import { Async, EmptyView, LoadingView } from '@/premium/kit';
import { Button, Screen, TopBar } from '@/premium/ui';
import type { Booking, FamilyMember, UpdateReservationRequest } from '@/types/domain';

export default function EditReservationScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const booking = useBooking(id);
  const family = useFamily();

  const b = booking.data;
  if (b == null || (family.isPending && family.data == null)) {
    // 404 = the reservation was deleted; useBooking doesn't retry it.
    const gone = !id || (booking.isError && toApiError(booking.error).status === 404);
    return (
      <Screen header={<TopBar title="Edit reservation" />}>
        {gone ? (
          <EmptyView icon={CalendarDays} title="Booking not found" body="This booking is no longer available." />
        ) : (
          <Async
            q={booking}
            emptyView={<EmptyView icon={CalendarDays} title="Booking not found" body="This booking is no longer available." />}
          >
            {() => <LoadingView />}
          </Async>
        )}
      </Screen>
    );
  }

  if (!isEditableReservation(b)) {
    return (
      <Screen header={<TopBar title="Edit reservation" />}>
        <EmptyView
          icon={CalendarX}
          title="This booking can't be changed"
          body="Only your own upcoming reservations can be edited."
          action={<Button label="Back to booking" tone="white" size="sm" full={false} onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  return <EditForm b={b} family={family.data ?? []} />;
}

/** Mounted once per booking: the form's baseline (for the changed-fields
 *  diff) must not move when the booking refetches underneath it. */
function EditForm({ b, family }: { b: Booking; family: FamilyMember[] }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();
  const update = useUpdateReservation();
  const [initial] = useState(() => draftFromBooking(b, family));
  const [membersUnknown] = useState(() => !membersKnown(b, family));

  const close = () => (router.canGoBack() ? router.back() : router.replace({ pathname: '/booking/[id]', params: { id: b.id } } as never));

  const onUpdate = async (patch: UpdateReservationRequest) => {
    if (Object.keys(patch).length === 0) {
      close();
      return { ok: true as const };
    }
    try {
      await update.mutateAsync({ id: b.id, patch });
      toast({ variant: 'success', title: 'Reservation updated' });
      close();
      return { ok: true as const };
    } catch (error) {
      if (toApiError(error).serverCode === 'BOOKING_NOT_EDITABLE') {
        toast({ variant: 'error', title: toApiError(error).message });
        void qc.invalidateQueries({ queryKey: historyKeys.all });
        close();
        return { ok: true as const };
      }
      return { ok: false as const, error };
    }
  };

  return (
    <ReservationForm
      mode="edit"
      initial={initial}
      family={family}
      saving={update.isPending}
      onUpdate={onUpdate}
      membersUnknown={membersUnknown}
    />
  );
}
