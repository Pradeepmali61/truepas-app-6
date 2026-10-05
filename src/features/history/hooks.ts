import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/api';
import type { Booking, CreateReservationRequest, UpdateReservationRequest } from '@/types/domain';

export const historyKeys = {
  all: ['bookings'] as const,
  detail: (id: string) => ['bookings', id] as const,
};

export function useBookings() {
  return useQuery({ queryKey: historyKeys.all, queryFn: api.getBookings });
}

export function useBooking(id: string) {
  return useQuery({ queryKey: historyKeys.detail(id), queryFn: () => api.getBooking(id) });
}

/** Only the customer's own upcoming reservations can be edited or deleted. */
export function isEditableReservation(b: Booking): boolean {
  return b.source === 'customer' && b.status === 'upcoming';
}

function useInvalidateBookings() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: historyKeys.all });
    void qc.invalidateQueries({ queryKey: ['account'] });
    void qc.invalidateQueries({ queryKey: ['notifications'] });
  };
}

/** POST /bookings — dates as the user's local YYYY-MM-DD. */
export function useCreateReservation() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (payload: CreateReservationRequest) => api.createReservation(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateReservation() {
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateReservationRequest }) => api.updateReservation(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteReservation() {
  const invalidate = useInvalidateBookings();
  return useMutation({ mutationFn: (id: string) => api.deleteReservation(id), onSuccess: invalidate });
}
