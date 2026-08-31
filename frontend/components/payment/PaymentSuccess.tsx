'use client'
import React, { useEffect, useState } from 'react';
import { CheckCircle, MessageCircle, ExternalLink, Calendar, User, Shield, Wallet, Coins, Copy } from 'lucide-react';
import Link from 'next/link';
import { BookingTimeline } from './BookingTimeline';
import { formatBookingDate, formatRelativeTime } from '@/lib/booking-formatters';

interface PaymentSuccessProps {
  serviceTitle?: string;
  freelancerEmail?: string;
  bookingId?: string;
  totalAmount?: number;
  bookingData?: {
    createdAt: number;
    deliveryDeadline: number;
    deliveryDays: number;
    paymentCompletedAt: number;
    bookingConfirmedAt: number;
    transactionId?: string;
    tokenSymbol?: string;
    tokenAmount?: string;
  };
}

export function PaymentSuccess({
  serviceTitle,
  freelancerEmail,
  bookingId,
  totalAmount,
  bookingData
}: PaymentSuccessProps) {
  const currentTime = Date.now();
  const defaultBookingData = {
    createdAt: currentTime,
    deliveryDeadline: currentTime + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    deliveryDays: 7,
    paymentCompletedAt: currentTime,
    bookingConfirmedAt: currentTime
  };

  const bookingInfo = bookingData || defaultBookingData;
  const [countdown, setCountdown] = useState(10);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [copiedTxId, setCopiedTxId] = useState(false);

  const copyTransactionId = () => {
    if (bookingData?.transactionId) {
      navigator.clipboard.writeText(bookingData.transactionId);
      setCopiedTxId(true);
      setTimeout(() => setCopiedTxId(false), 2000);
    }
  };

  useEffect(() => {
    if (!autoRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to chat
          window.location.href = `/client/chat?with=${encodeURIComponent(freelancerEmail)}`;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirect, freelancerEmail]);

  const cancelAutoRedirect = () => {
    setAutoRedirect(false);
  };

  const goToChat = () => {
    window.location.href = `/client/chat?with=${encodeURIComponent(freelancerEmail)}`;
  };

  const viewBooking = () => {
    window.location.href = '/client/projects';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-green-100">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 animate-pulse">
            <CheckCircle size={48} className="text-white" />
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-600 rounded-full border-4 border-white flex items-center justify-center">
              <Wallet size={16} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Your booking has been confirmed and the freelancer has been notified.
          </p>
        </div>

        {/* Booking Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Booking Details</h3>

          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Service</span>
              <span className="text-sm font-medium text-gray-900 text-right">{serviceTitle}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Booking ID</span>
              <span className="text-sm font-medium text-gray-900">{bookingId}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Amount Paid</span>
              <span className="text-sm font-medium text-gray-900">${(totalAmount || 0).toFixed(2)}</span>
            </div>

            {bookingData?.tokenSymbol && bookingData?.tokenAmount && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">Token Payment</span>
                <div className="text-right">
                  <div className="flex items-center space-x-1">
                    <Coins size={14} className="text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {parseFloat(bookingData.tokenAmount).toFixed(4)} {bookingData.tokenSymbol}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {bookingData?.transactionId && (
              <div className="flex items-start justify-between">
                <span className="text-sm text-gray-600">Transaction ID</span>
                <button
                  onClick={copyTransactionId}
                  className="text-sm font-mono text-purple-600 hover:text-purple-700 flex items-center space-x-1"
                  title="Click to copy"
                >
                  <span>{bookingData.transactionId.substring(0, 12)}...</span>
                  {copiedTxId ? (
                    <CheckCircle size={14} className="text-green-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            )}

            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Freelancer</span>
              <span className="text-sm font-medium text-gray-900">{freelancerEmail}</span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Booked On</span>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">{formatRelativeTime(bookingInfo.createdAt)}</span>
                <div className="text-xs text-gray-400">{formatBookingDate(bookingInfo.createdAt)}</div>
              </div>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-sm text-gray-600">Delivery Due</span>
              <div className="text-right">
                <span className="text-sm font-medium text-blue-600">{formatRelativeTime(bookingInfo.deliveryDeadline)}</span>
                <div className="text-xs text-gray-400">{formatBookingDate(bookingInfo.deliveryDeadline)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Timeline */}
        <div className="mb-6">
          <BookingTimeline
            bookingId={bookingId}
            createdAt={bookingInfo.createdAt}
            deliveryDeadline={bookingInfo.deliveryDeadline}
            status="active"
            deliveryDays={bookingInfo.deliveryDays}
            paymentCompletedAt={bookingInfo.paymentCompletedAt}
            bookingConfirmedAt={bookingInfo.bookingConfirmedAt}
          />
        </div>

        {/* Chat Access */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <MessageCircle className="text-purple-600" size={20} />
            <h3 className="font-medium text-purple-900">Chat Now Available</h3>
          </div>
          <p className="text-sm text-purple-700 mb-3">
            You can now start chatting with the freelancer to discuss your project details and requirements.
          </p>
          <button
            onClick={goToChat}
            className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <MessageCircle size={18} />
            <span>Start Chat</span>
          </button>
        </div>

        {/* Auto-redirect Notice */}
        {autoRedirect && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="text-blue-600" size={16} />
                <span className="text-sm text-blue-700">
                  Redirecting to chat in {countdown} seconds...
                </span>
              </div>
              <button
                onClick={cancelAutoRedirect}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={goToChat}
            className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <MessageCircle size={18} />
            <span>Go to Chat</span>
          </button>

          <button
            onClick={viewBooking}
            className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center space-x-2"
          >
            <ExternalLink size={18} />
            <span>View My Projects</span>
          </button>
        </div>

        {/* Next Steps */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">What happens next?</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Freelancer will acknowledge your booking and start working</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>You'll receive updates through the chat system</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>Payment is held in escrow until delivery completion</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-600 mt-0.5">•</span>
              <span>You can request revisions if needed</span>
            </li>
          </ul>
        </div>

        {/* Transaction Info */}
        {bookingData?.transactionId && (
          <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Wallet className="text-purple-600 mt-1" size={18} />
              <div className="text-sm text-purple-900">
                <div className="font-semibold mb-1">Transaction Details</div>
                <p className="text-purple-700">
                  Transaction processed securely on the Internet Computer blockchain.
                  <a
                    href={`https://dashboard.internetcomputer.org/transaction/${bookingData.transactionId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-purple-600 hover:text-purple-700 underline flex items-center space-x-1"
                  >
                    <span>View on ICP Dashboard</span>
                    <ExternalLink size={12} />
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Protection Notice */}
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Shield className="text-green-600 mt-1" size={18} />
            <div className="text-sm text-green-700">
              <div className="font-medium mb-1">Escrow Protection</div>
              <p>Your payment is held securely in escrow until the service is delivered to your satisfaction.</p>
            </div>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Need help? <Link href="/support" className="text-purple-600 hover:text-purple-700 underline">Contact Support</Link>
          </p>
          <p className="text-xs text-gray-500">
            You'll also receive a confirmation email at your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
}