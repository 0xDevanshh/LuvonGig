/**
 * The payment provider interface.
 *
 * Everything above this line is provider-agnostic: routes, authorization, the
 * payment state machine, reconciliation. Everything below it is one vendor.
 * If Stripe Connect turns out to be unavailable in a freelancer's country, the
 * replacement is a second implementation of this file — not a rewrite of the
 * payment flow.
 *
 * Money is always integer minor units plus an ISO-4217 currency, matching the
 * database. No provider type leaks through these signatures.
 */

export interface OnboardingLink {
  /** Where to send the user to complete verification. */
  url: string;
  providerAccountId: string;
}

export interface AccountStatus {
  providerAccountId: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  /** Whatever the provider is still waiting on, for the onboarding UI. */
  requirements: Record<string, unknown>;
  country: string | null;
  defaultCurrency: string | null;
}

export interface CreateIntentInput {
  amountMinor: bigint;
  currency: string;
  /** Groups the charge with the transfers that later settle it. */
  transferGroup: string;
  /** Survives into the provider dashboard; useful when reconciling by hand. */
  metadata: Record<string, string>;
  /** Makes "pay for this booking" safe to retry. */
  idempotencyKey: string;
}

export interface IntentResult {
  providerPaymentId: string;
  /** Handed to the browser SDK to complete the payment. */
  clientSecret: string | null;
  status: string;
}

export interface TransferInput {
  amountMinor: bigint;
  currency: string;
  destinationAccountId: string;
  transferGroup: string;
  metadata: Record<string, string>;
  idempotencyKey: string;
}

export interface TransferResult {
  providerTransferId: string;
}

export interface RefundInput {
  providerPaymentId: string;
  /** Omit for a full refund. */
  amountMinor?: bigint;
  reason?: string;
  idempotencyKey: string;
}

export interface RefundResult {
  providerRefundId: string;
  refundedMinor: bigint;
}

/** A webhook that has been verified as genuinely from the provider. */
export interface VerifiedEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: 'stripe' | 'razorpay' | 'icpay' | 'manual';

  /** Creates the connected account if absent, and returns a link to finish setup. */
  startOnboarding(userId: string, email: string, returnUrl: string, refreshUrl: string): Promise<OnboardingLink>;

  getAccountStatus(providerAccountId: string): Promise<AccountStatus>;

  createIntent(input: CreateIntentInput): Promise<IntentResult>;

  /** Moves the freelancer's share out of the platform balance. */
  transferToAccount(input: TransferInput): Promise<TransferResult>;

  refund(input: RefundInput): Promise<RefundResult>;

  /**
   * Verifies a webhook signature over the EXACT bytes received. Must throw if
   * the signature does not match — an unverified webhook is an instruction
   * from an unauthenticated stranger to move money.
   */
  verifyWebhook(rawBody: Buffer, signatureHeader: string): VerifiedEvent;
}

/** Thrown for provider failures the caller can act on. */
export class ProviderError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}
