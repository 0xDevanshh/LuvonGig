'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, ExternalLink, XCircle } from 'lucide-react';

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
    case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
    case 'Failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
    default: return <Clock className="w-4 h-4 text-gray-500" />;
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

  // Get amounts in e8s (ICP has 8 decimals)
  const totalAmountE8s = Number(project.total_amount_e8s || 0);

  // Escrow amount (what the freelancer receives)
  // If base_amount_e8s is present, use it. Otherwise calculate from total.
  // totalAmount = baseAmount * (1 + fee) + networkFee
  // For simplicity in display, we use a slightly more accurate fallback than the old 0.95
  const escrowAmountE8s = Number(
    project.base_amount_e8s ||
    project.escrow_amount_e8s ||
    Math.floor(totalAmountE8s / (1 + freelancerFee))
  );

  const releasedAmountE8s = totalAmountE8s - escrowAmountE8s;

  // Convert to ICP (divide by 100000000)
  const totalAmountICP = totalAmountE8s / 100000000;
  const escrowAmountICP = escrowAmountE8s / 100000000;
  const releasedAmountICP = releasedAmountE8s / 100000000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          Financial Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Amount Display */}
        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 font-medium mb-1">Total Project Value</div>
          <div className="text-xl sm:text-2xl font-bold text-blue-900 truncate">
            {totalAmountICP.toFixed(5)} ICP
          </div>
          {/* {project.total_amount_usd && project.total_amount_usd > 0 && (
            <div className="text-sm text-blue-600 mt-1 break-words">
              (${project.total_amount_usd.toFixed(2)} USD)
            </div>
          )} */}
          <div className="text-xs text-blue-600 mt-1">
            {paymentStatus === 'Completed' ? 'Fully Paid' : 'Payment in Escrow'}
          </div>
        </div>

        {/* Financial Breakdown */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-sm text-gray-600 flex-shrink-0">Total Amount</span>
              <div className="text-right min-w-0 overflow-hidden">
                <div className="text-sm font-medium truncate">{totalAmountICP.toFixed(5)} ICP</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: '100%' }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-sm text-gray-600 flex-shrink-0">In Escrow</span>
              <div className="text-right min-w-0 overflow-hidden">
                <div className="text-sm font-medium truncate">{escrowAmountICP.toFixed(5)} ICP</div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: totalAmountE8s > 0 ? `${Math.min((escrowAmountE8s / totalAmountE8s) * 100, 100)}%` : '0%'
                }}
              ></div>
            </div>
          </div>

          {releasedAmountICP > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="text-sm text-gray-600 flex-shrink-0">Released to Freelancer</span>
                <div className="text-right min-w-0 overflow-hidden">
                  <div className="text-sm font-medium text-green-600 truncate">
                    {releasedAmountICP.toFixed(5)} ICP
                  </div>
                  {project.total_amount_usd && project.escrow_amount_usd && (
                    <div className="text-xs text-gray-500 break-words">
                      ${(project.total_amount_usd - project.escrow_amount_usd).toFixed(2)} USD
                    </div>
                  )}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: totalAmountE8s > 0 ? `${(releasedAmountE8s / totalAmountE8s) * 100}%` : '0%'
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div>
            <div className="text-sm text-gray-500 mb-1">Payment Status</div>
            <div className="flex items-center gap-2">
              {getPaymentStatusIcon(paymentStatus)}
              <Badge
                variant={paymentStatus === 'Completed' ? 'default' : 'outline'}
                className={paymentStatus === 'Completed' ? 'bg-green-100 text-green-800' : ''}
              >
                {paymentStatus}
              </Badge>
            </div>
          </div>

          <div>
            <div className="text-sm text-gray-500 mb-1">Payment Method</div>
            <Badge variant="outline" className="text-xs">
              {project.payment_method ? project.payment_method.replace('-', ' ').toUpperCase() : 'ICP'}
            </Badge>
          </div>

          {project.payment_id && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Payment ID</div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  {project.payment_id.slice(-12)}...
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => navigator.clipboard.writeText(project.payment_id)}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {project.ledger_deposit_block && (
            <div>
              <div className="text-sm text-gray-500 mb-1">Transaction Block</div>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                  #{project.ledger_deposit_block.toString()}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => navigator.clipboard.writeText(project.ledger_deposit_block.toString())}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Financial Actions */}
        <div className="pt-4 border-t border-gray-200 space-y-3">
          {projectStatus !== 'Completed' && onMarkComplete && (
            <Button
              onClick={onMarkComplete}
              disabled={completing}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              {completing ? (
                <>
                  <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                  Marking as Complete...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Complete
                </>
              )}
            </Button>
          )}

          {paymentStatus === 'HeldInEscrow' && (
            <>
              {onReleaseFunds && (
                <Button
                  onClick={onReleaseFunds}
                  disabled={releasing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {releasing ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                      Releasing Funds...
                    </>
                  ) : (
                    <>
                      <DollarSign className="w-4 h-4 mr-2" />
                      Release Funds to Freelancer
                    </>
                  )}
                </Button>
              )}

              {onRefundFunds && (
                <Button
                  onClick={onRefundFunds}
                  disabled={refunding}
                  variant="outline"
                  className="w-full border-red-300 text-red-600 hover:bg-red-50"
                >
                  {refunding ? (
                    <>
                      <AlertCircle className="w-4 h-4 mr-2 animate-spin" />
                      Refunding...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Refund Funds
                    </>
                  )}
                </Button>
              )}
            </>
          )}

          {onViewTransaction && (
            <Button
              variant="outline"
              className="w-full"
              onClick={onViewTransaction}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              View Transaction Details
            </Button>
          )}

          {projectStatus === 'Completed' && (
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <p className="text-xs text-green-800 font-medium">Project Completed</p>
            </div>
          )}

          {paymentStatus === 'Released' && (
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <DollarSign className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <p className="text-xs text-blue-800 font-medium">Funds Released</p>
            </div>
          )}

          {paymentStatus === 'Refunded' && (
            <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <AlertCircle className="w-6 h-6 text-yellow-600 mx-auto mb-1" />
              <p className="text-xs text-yellow-800 font-medium">Funds Refunded</p>
            </div>
          )}
        </div>

        {/* Financial Summary */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <div className="flex items-center gap-1 mb-1">
            <DollarSign className="w-3 h-3" />
            <span className="font-medium">Financial Summary</span>
          </div>
          <ul className="space-y-1 ml-4">
            <li>• Funds are held in secure escrow until project milestones are completed</li>
            <li>• Payments are released to the freelancer upon stage approval</li>
            <li>• All transactions are recorded on the blockchain for transparency</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}