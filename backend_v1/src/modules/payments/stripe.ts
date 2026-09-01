/**
 * Stripe Connect, using SEPARATE CHARGES AND TRANSFERS.
 *
 * The client is charged on the PLATFORM account, so the money sits in the
 * platform balance until the work is accepted. That holding period is the
 * escrow — the thing escrow.mo did by keeping ICP in a canister. Only on
 * release does a Transfer move the freelancer's share to their connected
 * account.
 *
 * The alternative Connect shape, destination charges, pays out automatically
 * on capture and therefore cannot express escrow at all.
 *
 * Two constraints worth knowing before this goes live:
 *   - separate charges and transfers requires the platform and the recipient
 *     to be in regions Stripe allows to transfer between; this is the region
 *     check that has not been run yet
 *   - funds must be available in the platform balance before a transfer, which
 *     for card payments means after the settlement delay, not immediately
 */
import Stripe from 'stripe';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';
import {
  ProviderError,
  type AccountStatus, type CreateIntentInput, type IntentResult, type OnboardingLink,
  type PaymentProvider, type RefundInput, type RefundResult, type TransferInput,
  type TransferResult, type VerifiedEvent,
} from './provider.js';

/** Stripe takes amounts as a JS number of minor units; guard the 2^53 edge. */
function toStripeAmount(minor: bigint): number {
  if (minor > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new ProviderError('Amount exceeds the maximum Stripe accepts', 'AMOUNT_TOO_LARGE', false);
  }
  if (minor <= 0n) {
    throw new ProviderError('Amount must be greater than zero', 'AMOUNT_INVALID', false);
  }
  return Number(minor);
}

/** Stripe's card-error family is the caller's problem; the rest is ours. */
function wrap(err: unknown, fallback: string): ProviderError {
  if (err instanceof Stripe.errors.StripeError) {
    const retryable =
      err.type === 'StripeConnectionError' ||
      err.type === 'StripeAPIError' ||
      err.type === 'StripeRateLimitError';
    return new ProviderError(err.message, err.code ?? err.type, retryable);
  }
  return new ProviderError(fallback, 'PROVIDER_ERROR', false);
}

export class StripeProvider implements PaymentProvider {
  readonly name = 'stripe' as const;

  private readonly stripe: Stripe;

  constructor(secretKey: string, private readonly webhookSecret: string) {
    this.stripe = new Stripe(secretKey, {
      // Pinned: an account-level API version change must not silently alter
      // the shapes this file parses.
      apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
      typescript: true,
      maxNetworkRetries: 2,
      timeout: 20_000,
    });
  }

  async startOnboarding(
    userId: string, email: string, returnUrl: string, refreshUrl: string,
  ): Promise<OnboardingLink> {
    try {
      // Express accounts: Stripe hosts identity verification and KYC, which is
      // not something this platform should be storing.
      const account = await this.stripe.accounts.create({
        type: 'express',
        email,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: { userId },
      });

      const link = await this.stripe.accountLinks.create({
        account: account.id,
        return_url: returnUrl,
        refresh_url: refreshUrl,
        type: 'account_onboarding',
      });

      return { url: link.url, providerAccountId: account.id };
    } catch (err) {
      logger.error({ err, userId }, 'Stripe onboarding failed');
      throw wrap(err, 'Could not start payout onboarding');
    }
  }

  /** Refreshes an expired onboarding link without creating a second account. */
  async refreshOnboardingLink(
    providerAccountId: string, returnUrl: string, refreshUrl: string,
  ): Promise<OnboardingLink> {
    try {
      const link = await this.stripe.accountLinks.create({
        account: providerAccountId,
        return_url: returnUrl,
        refresh_url: refreshUrl,
        type: 'account_onboarding',
      });
      return { url: link.url, providerAccountId };
    } catch (err) {
      throw wrap(err, 'Could not refresh the onboarding link');
    }
  }

  async getAccountStatus(providerAccountId: string): Promise<AccountStatus> {
    try {
      const a = await this.stripe.accounts.retrieve(providerAccountId);
      return {
        providerAccountId: a.id,
        chargesEnabled: a.charges_enabled ?? false,
        payoutsEnabled: a.payouts_enabled ?? false,
        detailsSubmitted: a.details_submitted ?? false,
        requirements: (a.requirements ?? {}) as unknown as Record<string, unknown>,
        country: a.country ?? null,
        defaultCurrency: a.default_currency?.toUpperCase() ?? null,
      };
    } catch (err) {
      throw wrap(err, 'Could not read the payout account');
    }
  }

  async createIntent(input: CreateIntentInput): Promise<IntentResult> {
    try {
      const intent = await this.stripe.paymentIntents.create(
        {
          amount: toStripeAmount(input.amountMinor),
          currency: input.currency.toLowerCase(),
          // No `transfer_data` and no `on_behalf_of`: the charge lands on the
          // platform balance and stays there until release. This is what makes
          // it escrow rather than a pass-through.
          transfer_group: input.transferGroup,
          metadata: input.metadata,
          automatic_payment_methods: { enabled: true },
        },
        // Stripe deduplicates on this key for 24 hours, so a retried request
        // returns the original intent instead of charging twice.
        { idempotencyKey: input.idempotencyKey },
      );

      return {
        providerPaymentId: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
      };
    } catch (err) {
      logger.error({ err, transferGroup: input.transferGroup }, 'Stripe intent creation failed');
      throw wrap(err, 'Could not start the payment');
    }
  }

  async transferToAccount(input: TransferInput): Promise<TransferResult> {
    try {
      const transfer = await this.stripe.transfers.create(
        {
          amount: toStripeAmount(input.amountMinor),
          currency: input.currency.toLowerCase(),
          destination: input.destinationAccountId,
          transfer_group: input.transferGroup,
          metadata: input.metadata,
        },
        { idempotencyKey: input.idempotencyKey },
      );
      return { providerTransferId: transfer.id };
    } catch (err) {
      logger.error(
        { err, destination: input.destinationAccountId, transferGroup: input.transferGroup },
        'Stripe transfer failed',
      );
      throw wrap(err, 'Could not release the payment');
    }
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    try {
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: input.providerPaymentId,
          ...(input.amountMinor !== undefined && { amount: toStripeAmount(input.amountMinor) }),
          ...(input.reason === 'requested_by_customer' && { reason: 'requested_by_customer' }),
          metadata: input.reason ? { reason: input.reason } : {},
        },
        { idempotencyKey: input.idempotencyKey },
      );
      return {
        providerRefundId: refund.id,
        refundedMinor: BigInt(refund.amount),
      };
    } catch (err) {
      logger.error({ err, paymentId: input.providerPaymentId }, 'Stripe refund failed');
      throw wrap(err, 'Could not refund the payment');
    }
  }

  verifyWebhook(rawBody: Buffer, signatureHeader: string): VerifiedEvent {
    // constructEvent throws on a bad signature, a missing header, or a
    // timestamp outside the tolerance window (replay protection). Letting that
    // throw is the point: an unverified webhook is an unauthenticated stranger
    // asking us to move money.
    const event = this.stripe.webhooks.constructEvent(rawBody, signatureHeader, this.webhookSecret);
    return {
      id: event.id,
      type: event.type,
      payload: event.data.object as unknown as Record<string, unknown>,
    };
  }
}

let provider: StripeProvider | null = null;

/**
 * Returns null when Stripe is not configured, rather than throwing at import
 * time — the rest of the API must still boot and serve without payment keys.
 */
export function getStripeProvider(): StripeProvider | null {
  if (provider) return provider;
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) return null;
  provider = new StripeProvider(env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET);
  return provider;
}

/** Test seam: lets a suite install a stub without a live key. */
export function setProviderForTesting(p: StripeProvider | null): void {
  provider = p;
}
