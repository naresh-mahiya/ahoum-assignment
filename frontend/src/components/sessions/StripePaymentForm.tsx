import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { useState } from 'react';

import Button from '@/components/ui/Button';

interface Props {
  onSuccess: () => void;
  amountLabel: string;
}

export default function StripePaymentForm({ onSuccess, amountLabel }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'Payment failed.');
      setProcessing(false);
      return;
    }
    if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess();
    } else {
      setError('Payment did not complete. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" fullWidth loading={processing} disabled={!stripe}>
        Pay {amountLabel}
      </Button>
      <p className="text-center text-xs text-slate-400">
        Test card: 4242 4242 4242 4242 · any future date · any CVC
      </p>
    </form>
  );
}
