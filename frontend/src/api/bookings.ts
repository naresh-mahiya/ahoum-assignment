import type { Booking } from '@/types';

import apiClient from './client';

export async function createBooking(
  sessionId: number,
  notes = ''
): Promise<Booking> {
  const { data } = await apiClient.post<Booking>('/bookings/', {
    session: sessionId,
    notes,
  });
  return data;
}

export async function listMyBookings(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>('/bookings/my/');
  return data;
}

export async function cancelBooking(id: number): Promise<Booking> {
  const { data } = await apiClient.delete<Booking>(`/bookings/${id}/cancel/`);
  return data;
}

export async function listSessionBookings(sessionId: number): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>(`/bookings/session/${sessionId}/`);
  return data;
}
