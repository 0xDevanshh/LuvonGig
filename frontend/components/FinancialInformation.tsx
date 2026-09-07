'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink, XCircle } from 'lucide-react';
import { formatMoney, toMajorUnits } from '@/lib/currency';

interface FinancialInformationProps {
  project: any;
  freelancerFee?: number; // Optional plan-based fee (e.g. 0.04 for 4%)
  onViewTransaction?: () => void;
  onReleaseFunds?: () => void;
  onRefundFunds?: () => void;
  onMarkComplete?: () => void;
  releasing?: boolean;
  refunding?: boolean;
  completing?: boolean;
}

// Helper function to convert status object to string
const getStatusString = (status: any): string => {
  if (typeof status === 'string') {
    return status;
  } else if (typeof status === 'object' && status !== null) {
    const statusKey = Object.keys(status)[0];
    return statusKey || 'Pending';
  }
  return 'Pending';
};

// Helper function to get payment status icon
const getPaymentStatusIcon = (status: string) => {
  switch (status) {
    case 'Completed': return <CheckCircle className="size-4 text-success" />;
    case 'Pending': return <Clock className="size-4 text-warning" />;
    case 'Failed': return <AlertCircle className="size-4 text-destructive" />;
    default: return <Clock className="size-4 text-muted-foreground" />;
  }
};

export default function FinancialInformation({
  project,
  freelancerFee = 0.04, // Default to 4%
  onViewTransaction,
  onReleaseFunds,
  onRefundFunds,
  onMarkComplete,
  releasing = false,
  refunding = false,
  completing = false
}: FinancialInformationProps) {
  const paymentStatus = getStatusString(project.payment_status);
  const projectStatus = getStatusString(project.status);
  const currency = project.currency || 'USD';

  const totalAmountMinor = Number(project.total_minor || project.total_amount_minor || 0);

  // Escrow amount (what the freelancer receives). If the base amount isn't
  // present, estimate it by backing the platform fee out of the total.
  const escrowAmountMinor = Number(
    project.base_amount_minor ||
    project.escrow_amount_minor ||
    Math.floor(totalAmountMinor / (1 + freelancerFee))
  );

  const releasedAmountMinor = totalAmountMinor - escrowAmountMinor;

  const totalAmount = toMajorUnits(totalAmountMinor, currency);
  const escrowAmount = toMajorUnits(escrowAmountMinor, currency);
  const releasedAmount = toMajorUnits(releasedAmountMinor, currency);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="size-5" />
          Financial information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Amount Display */}
        <div className="rounded-lg border border-primary/20 bg-primary-soft p-4 text-center">
          <div className="mb-1 text-sm font-medium text-primary-hover">Total project value</div>
          <div className="truncate text-xl font-bold text-primary-hover sm:text-2xl">
            {formatMoney(totalAmountMinor, currency)}
          </div>
          <div className="mt-1 text-xs text-primary-hover">
            {paymentStatus === 'Completed' ? 'Fully paid' : 'Payment in escrow'}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">Total amount</span>
              <div className="min-w-0 overflow-hidden text-right">
                <div className="truncate text-sm font-medium text-foreground">{formatMoney(totalAmountMinor, currency)}</div>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div className="h-2 w-full rounded-full bg-primary transition-all duration-300" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="shrink-0 text-sm text-muted-foreground">In escrow</span>
              <div className="min-w-0 overflow-hidden text-right">
                <div className="truncate text-sm font-medium text-foreground">{formatMoney(escrowAmountMinor, currency)}</div>
              </div>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary">
              <div
                className="h-2 rounded-full bg-warning transition-all duration-300"
                style={{
                  width: totalAmountMinor > 0 ? `${Math.min((escrowAmountMinor / totalAmountMinor) * 100, 100)}%` : '0%'
                }}
              />
            </div>
          </div>

          {releasedAmount > 0 && (
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="shrink-0 text-sm text-muted-foreground">Released to freelancer</span>
                <div className="min-w-0 overflow-hidden text-right">
                  <div className="truncate text-sm font-medium text-success">
                    {formatMoney(releasedAmountMinor, currency)}
                  </div>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary">
                <div
                  className="h-2 rounded-full bg-success transition-all duration-300"
                  style={{
                    width: totalAmountMinor > 0 ? `${(releasedAmountMinor / totalAmountMinor) * 100}%` : '0%'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <div className="mb-1 text-sm text-muted-foreground">Payment status</div>
            <div className="flex items-center gap-2">
              {getPaymentStatusIcon(paymentStatus)}
              <Badge variant={paymentStatus === 'Completed' ? 'default' : 'outline'}>
                {paymentStatus}
              </Badge>
            </div>
          </div>

          <div>
            <div className="mb-1 text-sm text-muted-foreground">Payment method</div>
            <Badge variant="outline" className="text-xs">
              {project.payment_method ? project.payment_method.replace('-', ' ').toUpperCase() : 'CARD'}
            </Badge>
          </div>

          {project.payment_id && (
            <div>
              <div className="mb-1 text-sm text-muted-foreground">Payment ID</div>
              <div className="flex items-center gap-2">
                <code className="rounded bg-secondary px-2 py-1 font-mono text-xs">
                  {project.payment_id.slice(-12)}...
                </code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => navigator.clipboard.writeText(project.payment_id)}
                >
                  <ExternalLink className="size-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Financial Actions */}
        <div className="space-y-3 border-t border-border pt-4">
          {projectStatus !== 'Completed' && onMarkComplete && (
            <Button onClick={onMarkComplete} disabled={completing} className="w-full bg-success text-success-foreground hover:bg-success/90">
              {completing ? (
                <>
                  <AlertCircle className="size-4 animate-spin" />
                  Marking as complete...
                </>
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  Mark as complete
                </>
              )}
            </Button>
          )}

          {paymentStatus === 'HeldInEscrow' && (
            <>
              {onReleaseFunds && (
                <Button onClick={onReleaseFunds} disabled={releasing} className="w-full">
                  {releasing ? (
                    <>
                      <AlertCircle className="size-4 animate-spin" />
                      Releasing funds...
                    </>
                  ) : (
                    <>
                      <DollarSign className="size-4" />
                      Release funds to freelancer
                    </>
                  )}
                </Button>
              )}

              {onRefundFunds && (
                <Button
                  onClick={onRefundFunds}
                  disabled={refunding}
                  variant="outline"
                  className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                >
                  {refunding ? (
                    <>
                      <AlertCircle className="size-4 animate-spin" />
                      Refunding...
                    </>
                  ) : (
                    <>
                      <XCircle className="size-4" />
                      Refund funds
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {onViewTransaction && project.payment_id && (
            <Button variant="outline" className="w-full" onClick={onViewTransaction}>
              <TrendingUp className="size-4" />
              Copy payment ID
            </Button>
          )}

          {projectStatus === 'Completed' && (
            <div className="rounded-lg border border-success/20 bg-success/10 p-3 text-center">
              <CheckCircle className="mx-auto mb-1 size-6 text-success" />
              <p className="text-xs font-medium text-success">Project completed</p>
            </div>
          )}

          {paymentStatus === 'Released' && (
            <div className="rounded-lg border border-primary/20 bg-primary-soft p-3 text-center">
              <DollarSign className="mx-auto mb-1 size-6 text-primary-hover" />
              <p className="text-xs font-medium text-primary-hover">Funds released</p>
            </div>
          )}

          {paymentStatus === 'Refunded' && (
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-3 text-center">
              <AlertCircle className="mx-auto mb-1 size-6 text-warning" />
              <p className="text-xs font-medium text-warning">Funds refunded</p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
          <div className="mb-1 flex items-center gap-1">
            <DollarSign className="size-3" />
            <span className="font-medium text-foreground">Financial summary</span>
          </div>
          <ul className="ml-4 space-y-1">
            <li>&bull; Funds are held in secure escrow until project milestones are completed</li>
            <li>&bull; Payments are released to the freelancer upon stage approval</li>
            <li>&bull; All payments are processed securely by Stripe</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
