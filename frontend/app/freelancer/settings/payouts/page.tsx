'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CircleAlert, ExternalLink, Landmark, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
        router.push('/login');
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
    <div className="p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href="/freelancer/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to settings
        </Link>

        <header className="space-y-2">
          <h1 className="font-heading text-h1 font-semibold text-foreground">Payouts</h1>
          <p className="text-muted-foreground">
            Connect a Stripe account so clients&rsquo; payments can reach you once work is released.
          </p>
        </header>

        {cameBackFromStripe && state === 'loading' && (
          <div className="rounded-lg border border-primary/20 bg-primary-soft p-4 text-sm text-primary-hover">
            Checking your Stripe setup&hellip;
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <section className="space-y-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary-soft">
              <Landmark className="size-5 text-primary-hover" />
            </div>
            <div>
              <h2 className="font-heading text-h3 font-semibold text-foreground">Stripe account</h2>
              <p className="text-sm text-muted-foreground">Stripe handles identity verification and bank details directly.</p>
            </div>
          </div>

          {state === 'loading' && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <RefreshCw className="size-4 animate-spin" />
              Loading payout status&hellip;
            </div>
          )}

          {state === 'unconfigured' && (
            <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/10 p-4">
              <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
              <p className="text-sm text-warning">
                Payouts are not enabled on this environment yet. Check back once the platform has finished
                setting up Stripe.
              </p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex items-center justify-between py-4">
              <p className="text-sm text-muted-foreground">Something went wrong loading your payout status.</p>
              <button
                type="button"
                onClick={fetchStatus}
                className="text-sm font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {state === 'ready' && status && (
            <>
              {status.payouts_enabled ? (
                <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 p-4">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-success">Payouts are active</p>
                    <p className="text-xs text-success">
                      Released payments will transfer to your connected account
                      {status.country ? ` (${status.country})` : ''}.
                    </p>
                  </div>
                </div>
              ) : status.onboarded ? (
                <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/10 p-4">
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-warning">Almost there</p>
                    <p className="text-xs text-warning">
                      Stripe needs a bit more information before payouts can start.
                    </p>
                    {requirementsDue.length > 0 && (
                      <ul className="list-inside list-disc pt-1 text-xs text-warning">
                        {requirementsDue.map((item) => (
                          <li key={item}>{item.replace(/_/g, ' ')}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary p-4">
                  <CircleAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    You haven&apos;t connected a payout account yet. Clients can still book you, but a booking
                    can&apos;t be paid until this is set up — the checkout page checks for it first.
                  </p>
                </div>
              )}

              <Button onClick={handleConnect} disabled={connecting} className="w-full">
                {connecting ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    Opening Stripe&hellip;
                  </>
                ) : (
                  <>
                    <ExternalLink className="size-4" />
                    {status.payouts_enabled
                      ? 'Update payout details'
                      : status.onboarded
                        ? 'Continue setup on Stripe'
                        : 'Connect with Stripe'}
                  </>
                )}
              </Button>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
