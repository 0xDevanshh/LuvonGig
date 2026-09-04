'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CircleAlert, ExternalLink, Landmark, RefreshCw } from 'lucide-react';

interface PayoutStatus {
  onboarded: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  requirements?: { currently_due?: string[]; past_due?: string[] } | null;
  country?: string | null;
}

type LoadState = 'loading' | 'ready' | 'unconfigured' | 'error';

/**
 * Where Stripe sends a freelancer back to after onboarding.
 *
 * The URL is hardcoded server-side (payments/routes.ts, `returnUrl` /
 * `refreshUrl`) rather than passed in, so this page has to live at exactly
 * this path or Stripe's redirect 404s.
 */
export default function PayoutSettingsPage() {
  return (
    <Suspense fallback={null}>
      <PayoutSettings />
    </Suspense>
  );
}

/**
 * useSearchParams() opts a page out of static rendering unless it's wrapped in
 * Suspense — without this split, `next build` fails prerendering this route.
 */
function PayoutSettings() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<LoadState>('loading');
  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/payments/payouts/status');
      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }
      const body = await res.json();
      if (!res.ok || !body.success) {
        if (body.code === 'SERVICE_UNAVAILABLE') {
          setState('unconfigured');
          return;
        }
        throw new Error(body.error || 'Could not load payout status');
      }
      setStatus(body.data as PayoutStatus);
      setState('ready');
    } catch (err: any) {
      console.error('Error loading payout status:', err);
      setError(err.message || 'Could not load payout status');
      setState('error');
    }
  }, [router]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Stripe sends the freelancer back here with ?done=1 (finished the hosted
  // flow) or ?refresh=1 (the onboarding link expired mid-way). Either way the
  // only thing to do is re-check status — Stripe, not this app, knows whether
  // they actually finished.
  const cameBackFromStripe = searchParams.get('done') === '1' || searchParams.get('refresh') === '1';

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/payouts/onboard', { method: 'POST' });
      const body = await res.json();
      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Could not start payout setup');
      }
      window.location.href = body.data.url;
    } catch (err: any) {
      console.error('Error starting payout onboarding:', err);
      setError(err.message || 'Could not start payout setup');
      setConnecting(false);
    }
  };

  const requirementsDue = [
    ...(status?.requirements?.past_due ?? []),
    ...(status?.requirements?.currently_due ?? []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/freelancer/settings"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={14} />
          Back to settings
        </Link>

        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Payouts</h1>
          <p className="text-gray-600">
            Connect a Stripe account so clients' payments can reach you once work is released.
          </p>
        </header>

        {cameBackFromStripe && state === 'loading' && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
            Checking your Stripe setup…
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Landmark className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Stripe account</h2>
              <p className="text-sm text-gray-500">Stripe handles identity verification and bank details directly.</p>
            </div>
          </div>

          {state === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
              <RefreshCw size={16} className="animate-spin" />
              Loading payout status…
            </div>
          )}

          {state === 'unconfigured' && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
              <CircleAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-800">
                Payouts are not enabled on this environment yet. Check back once the platform has finished
                setting up Stripe.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-gray-500">Something went wrong loading your payout status.</p>
              <button
                type="button"
                onClick={fetchStatus}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
              >
                Try again
              </button>
            </div>
          )}

          {state === 'ready' && status && (
            <>
              {status.payouts_enabled ? (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-100">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-green-800">Payouts are active</p>
                    <p className="text-xs text-green-700">
                      Released payments will transfer to your connected account
                      {status.country ? ` (${status.country})` : ''}.
                    </p>
                  </div>
                </div>
              ) : status.onboarded ? (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <CircleAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-800">Almost there</p>
                    <p className="text-xs text-amber-700">
                      Stripe needs a bit more information before payouts can start.
                    </p>
                    {requirementsDue.length > 0 && (
                      <ul className="text-xs text-amber-700 list-disc list-inside pt-1">
                        {requirementsDue.map((item) => (
                          <li key={item}>{item.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <CircleAlert className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-600">
                    You haven't connected a payout account yet. Clients can still book you, but a booking
                    can't be paid until this is set up — the checkout page checks for it first.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={handleConnect}
                disabled={connecting}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {connecting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Opening Stripe…
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} />
                    {status.payouts_enabled
                      ? 'Update payout details'
                      : status.onboarded
                        ? 'Continue setup on Stripe'
                        : 'Connect with Stripe'}
                  </>
                )}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
