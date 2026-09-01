'use client';

/**
 * Card checkout, replacing ICPayWidget and EscrowManager.
 *
 * The money is charged to the platform and held there until the client
 * releases it — the same escrow guarantee the ICP canister provided, without
 * the wallet. This component only collects the card; the hold, release and
 * refund rules live on the server.
 *
 * The publishable key is safe in the browser by design; the secret key never
 * leaves the backend.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';

/**
 * Either pay for an existing booking, or book-and-pay in one step.
 *
 * `packageId` mirrors what EscrowManager used to accept: the old flow created
 * the escrow (and the booking) from a package, so the checkout pages never had
 * a booking id to hand. `/api/payments/checkout` keeps that shape.
 */
interface Props {
  bookingId?: string;
  packageId?: string;
  /** Job proposals: reserved for when job payments move onto this module. */
  proposalId?: string;
  /**
   * Non-booking purposes (expert sessions, subscriptions) name their own
   * endpoint and payload. The server still decides the amount — this only
   * says which thing is being paid for.
   */
  endpoint?: string;
  payload?: Record<string, unknown>;
  requirements?: string[];
  specialInstructions?: string;
  /** Minor units, for display only — the server decides what is actually charged. */
  amountMinor?: string | number;
  currency?: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (message: string) => void;
}

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    // Resolving null rather than throwing keeps the page renderable when
    // payments are not configured; the UI below explains why.
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

function formatAmount(minor: string | number | undefined, currency: string): string {
  if (minor === undefined) return '';
  const value = Number(minor) / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

function CheckoutForm({ amountMinor, currency = 'USD', paymentId, onSuccess, onError }: {
  amountMinor?: string | number;
  currency?: string;
  paymentId: string;
  onSuccess?: (paymentId: string) => void;
  onError?: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!stripe || !elements || submitting) return;

      setSubmitting(true);
      setMessage(null);

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/client/payment-success?payment=${paymentId}`,
        },
        // Stay on the page when no redirect is required, so the caller can
        // react without a full page load.
        redirect: 'if_required',
      });

      if (error) {
        // card_error and validation_error are safe to show; anything else is
        // an internal detail the customer cannot act on.
        const text =
          error.type === 'card_error' || error.type === 'validation_error'
            ? error.message ?? 'Your card could not be charged.'
            : 'Something went wrong processing that payment. Please try again.';
        setMessage(text);
        onError?.(text);
        setSubmitting(false);
        return;
      }

      // The payment is confirmed with Stripe. The booking is not marked paid
      // here — that happens when the signed webhook arrives, which is the only
      // source that can actually confirm the money moved.
      onSuccess?.(paymentId);
      setSubmitting(false);
    },
    [stripe, elements, submitting, paymentId, onSuccess, onError],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />

      {message && (
        <p className="text-sm text-red-600" role="alert">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Processing…' : `Pay ${formatAmount(amountMinor, currency)}`}
      </button>

      <p className="text-xs text-gray-500">
        Your payment is held securely and only released to the freelancer once you approve the work.
      </p>
    </form>
  );
}

export function StripeCheckout({
  bookingId, packageId, proposalId, endpoint, payload, requirements, specialInstructions,
  amountMinor, currency = 'USD', onSuccess, onError,
}: Props) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!bookingId && !packageId && !endpoint) {
        const text = proposalId
          ? 'Paying for an accepted proposal is not available yet.'
          : 'Nothing to pay for.';
        setError(text);
        onError?.(text);
        return;
      }

      try {
        // An existing booking pays through /intent; a package books and pays
        // in one call, which is the shape the old escrow checkout used.
        const [url, requestBody]: [string, Record<string, unknown>] = endpoint
          ? [endpoint, payload ?? {}]
          : bookingId
            ? ['/api/payments/intent', { booking_id: bookingId }]
            : ['/api/payments/checkout', {
                package_id: packageId,
                requirements: requirements ?? [],
                special_instructions: specialInstructions ?? '',
              }];

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        const body = (await res.json()) as {
          success?: boolean;
          error?: string;
          data?: { client_secret: string | null; payment: { id: string } };
        };

        if (cancelled) return;

        if (!res.ok || !body.success || !body.data) {
          const text = body.error ?? 'Could not start the payment.';
          setError(text);
          onError?.(text);
          return;
        }

        setClientSecret(body.data.client_secret);
        setPaymentId(body.data.payment.id);
      } catch {
        if (cancelled) return;
        const text = 'Could not reach the payment service. Please try again.';
        setError(text);
        onError?.(text);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bookingId, packageId, proposalId, endpoint, payload, requirements, specialInstructions, onError]);

  const options = useMemo(
    () => (clientSecret ? { clientSecret, appearance: { theme: 'stripe' as const } } : null),
    [clientSecret],
  );

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!options || !paymentId) {
    return (
      <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
        Preparing checkout…
      </div>
    );
  }

  return (
    <Elements stripe={getStripe()} options={options}>
      <CheckoutForm
        amountMinor={amountMinor}
        currency={currency}
        paymentId={paymentId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}

export default StripeCheckout;
