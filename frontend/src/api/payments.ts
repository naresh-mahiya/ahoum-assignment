import apiClient from './client';

export async function createPaymentIntent(
  bookingId: number
): Promise<{ client_secret: string; payment_intent_id: string }> {
  const { data } = await apiClient.post('/payments/create-intent/', {
    booking_id: bookingId,
  });
  return data;
}

export async function getPaymentStatus(
  bookingId: number
): Promise<{ booking_id: number; status: string; payment_status: string }> {
  const { data } = await apiClient.get(`/payments/session/${bookingId}/status/`);
  return data;
}
