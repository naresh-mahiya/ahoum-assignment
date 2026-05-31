import { Elements } from '@stripe/react-stripe-js';
import { type Stripe, loadStripe } from '@stripe/stripe-js';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { createBooking } from '@/api/bookings';
import { extractError } from '@/api/client';
import { createPaymentIntent } from '@/api/payments';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useBookingMutations } from '@/hooks/useBookings';
import { formatDateTime, formatDuration, formatPrice } from '@/lib/format';
import { toast } from '@/lib/toast';
import type { Session } from '@/types';

import StripePaymentForm from './StripePaymentForm';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise: Promise<Stripe | null> | null =
  STRIPE_KEY && !STRIPE_KEY.startsWith('pk_test_your')
    ? loadStripe(STRIPE_KEY)
    : null;

type Step = 'confirm' | 'pay' | 'done';

interface Props {
  session: Session;
  open: boolean;
  onClose: () => void;
}

export default function BookingModal({ session, open, onClose }: Props) {
  const navigate = useNavigate();
  const { book } = useBookingMutations();
  const [step, setStep] = useState<Step>('confirm');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const reset = () => {
    setStep('confirm');
    setClientSecret(null);
    setWorking(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Free session → confirm immediately via the booking mutation.
  const handleFreeConfirm = () => {
    book.mutate(
      { sessionId: session.id },
      {
        onSuccess: () => setStep('done'),
      }
    );
  };

  // Paid session → create a pending booking, then a PaymentIntent.
  const handleStartPayment = async () => {
    setWorking(true);
    try {
      const booking = await createBooking(session.id);
      const intent = await createPaymentIntent(booking.id);
      setClientSecret(intent.client_secret);
      setStep('pay');
    } catch (err) {
      toast.error(extractError(err, 'Could not start checkout'));
    } finally {
      setWorking(false);
    }
  };

  const priceLabel = formatPrice(session.price, session.is_free);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'done' ? 'Booking confirmed' : 'Confirm your booking'}
    >
      {step === 'done' ? (
        <div className="py-4 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">You’re booked! 🎉</h3>
          <p className="mt-1 text-sm text-slate-500">
            {session.title} · {formatDateTime(session.scheduled_at)}
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" fullWidth onClick={handleClose}>
              Keep browsing
            </Button>
            <Button fullWidth onClick={() => navigate('/dashboard')}>
              View my bookings
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl bg-slate-50 p-4">
            <h3 className="font-semibold text-slate-900">{session.title}</h3>
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-slate-400" />
                {formatDateTime(session.scheduled_at)}
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-slate-400" />
                {formatDuration(session.duration_minutes)}
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm text-slate-500">Total</span>
              <span className="text-lg font-bold text-slate-900">{priceLabel}</span>
            </div>
          </div>

          {step === 'confirm' && (
            <>
              {session.is_free ? (
                <Button
                  fullWidth
                  loading={book.isPending}
                  onClick={handleFreeConfirm}
                >
                  Confirm free booking
                </Button>
              ) : stripePromise ? (
                <Button fullWidth loading={working} onClick={handleStartPayment}>
                  Continue to payment
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
                    Stripe isn’t configured in this environment, so paid checkout
                    is unavailable. Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> and{' '}
                    <code>STRIPE_SECRET_KEY</code> to enable it.
                  </p>
                  <Button variant="secondary" fullWidth onClick={handleClose}>
                    Close
                  </Button>
                </div>
              )}
            </>
          )}

          {step === 'pay' && clientSecret && stripePromise && (
            <Elements
              stripe={stripePromise}
              options={{ clientSecret, appearance: { theme: 'stripe' } }}
            >
              <StripePaymentForm
                amountLabel={priceLabel}
                onSuccess={() => {
                  toast.success('Payment successful!');
                  setStep('done');
                }}
              />
            </Elements>
          )}
        </div>
      )}
    </Modal>
  );
}
