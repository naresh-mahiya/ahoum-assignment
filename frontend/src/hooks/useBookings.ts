import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { cancelBooking, createBooking, listMyBookings } from '@/api/bookings';
import { extractError } from '@/api/client';
import { toast } from '@/lib/toast';

export function useMyBookings() {
  return useQuery({
    queryKey: ['my-bookings'],
    queryFn: listMyBookings,
  });
}

export function useBookingMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['my-bookings'] });
    qc.invalidateQueries({ queryKey: ['session'] });
    qc.invalidateQueries({ queryKey: ['sessions'] });
  };

  const book = useMutation({
    mutationFn: ({ sessionId, notes }: { sessionId: number; notes?: string }) =>
      createBooking(sessionId, notes),
    onSuccess: () => {
      invalidate();
      toast.success('Session booked! 🎉');
    },
    onError: (err) => toast.error(extractError(err, 'Booking failed')),
  });

  const cancel = useMutation({
    mutationFn: (id: number) => cancelBooking(id),
    onSuccess: () => {
      invalidate();
      toast.info('Booking cancelled.');
    },
    onError: (err) => toast.error(extractError(err, 'Could not cancel booking')),
  });

  return { book, cancel };
}
