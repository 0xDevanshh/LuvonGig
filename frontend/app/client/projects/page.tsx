'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useBookings, useJobProjects } from '@/hooks/useMarketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatMoney } from '@/lib/currency';
import { formatBookingDate, formatBookingDateShort, formatRelativeTime, isOverdue, getTimeRemaining } from '@/lib/date-utils';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  User,
  RefreshCw,
  Wallet,
  Send,
  ArrowLeft
} from 'lucide-react';

/** The live payment for a booking, as /api/payments/for-booking returns it. */
interface BookingPayment {
  id: string;
  state: string;
  currency: string;
  amount_minor: string;
}

/** 'held' is the escrow state: captured, and still on the platform balance. */
const isHeld = (payment: BookingPayment | null | undefined) => payment?.state === 'held';

export default function ClientProjects() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string>(''); // For service bookings (email)
  const [jobUserId, setJobUserId] = useState<string>(''); // For job marketplace (8-char ID)
  const [statusFilter, setStatusFilter] = useState<string>('');
  // Keyed by booking id. A key present with a null value means "looked up, and
  // this booking has no live payment" — distinct from "not looked up yet".
  const [payments, setPayments] = useState<Record<string, BookingPayment | null>>({});
  const [processingPayment, setProcessingPayment] = useState<Record<string, 'releasing' | 'refunding'>>({});

  const {
    bookings,
    loading: bookingsLoading,
    error: bookingsError,
    fetchBookings
  } = useBookings(userId, 'client');

  const {
    projects: jobProjects,
    loading: jobsLoading,
    error: jobsError,
    refetch: fetchJobs
  } = useJobProjects(jobUserId, 'client');

  const [allProjects, setAllProjects] = useState<any[]>([]);

  // Combine and normalize projects
  useEffect(() => {
    const normalizedBookings = (bookings as any[]).map(b => ({
      ...b,
      id: b.booking_id,
      title: b.service_title || 'Service Project',
      type: 'service',
      displayStatus: getStatusString(b.status),
      // Integer minor units and a currency, formatted at render. The e8s
      // division that used to be here dated from ICP and made a $100 booking
      // read as 0.0001.
      amountMinor: b.total_minor,
      currency: b.currency || 'USD',
      createdAt: Number(b.created_at),
      freelancer: b.freelancer_email || b.freelancer_id
    }));


    const normalizedJobs = jobProjects
      .filter((j: any) => {
        const rawStatus = getStatusString(j.status);
        const status = rawStatus.toUpperCase();
        const shouldShow = status === 'ASSIGNED' || status === 'INPROGRESS' || status === 'COMPLETED' || status === 'COMPLETEDANDPAID';
        if (!shouldShow) {

        }
        return shouldShow;
      })
      .map((j: any) => ({
        ...j,
        id: `job_${j.id}`,
        title: j.title || 'Job Project',
        type: 'job',
        displayStatus: getStatusString(j.status),
        // toJobDto sends budget_minor; `budgetAmount` never existed on it and
        // rendered every job card as "NaN ICP".
        amountMinor: j.budget_minor,
        currency: j.currency || 'USD',
        createdAt: Number(j.createdAt),
        freelancer: j.freelancerId,
        payment_status: getStatusString(j.status) === 'CompletedAndPaid' ? 'Paid' : 'HeldInEscrow',
        payment_method: 'escrow'
      }));

    const combined = [...normalizedBookings, ...normalizedJobs].sort((a, b) => b.createdAt - a.createdAt);

    setAllProjects(combined);
  }, [bookings, jobProjects]);

  // Fetch current session on component mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data.success && data.session) {

          setSession(data.session);
          setUserId(data.session.email); // Use email for service bookings
          setJobUserId(data.session.userId || data.session.email); // Use 8-char ID, fallout to email
        } else {

          // Redirect to login if no session
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('🎫 ClientProjects: Error fetching session:', error);
        router.push('/auth/login');
      }
    };

    fetchSession();
  }, [router]);

  useEffect(() => {
    if (userId) {
      fetchBookings();
    }
    if (jobUserId) {
      fetchJobs();
    }
  }, [fetchBookings, fetchJobs, userId, jobUserId, statusFilter]);


  /**
   * Look up a booking's live payment.
   *
   * One request, keyed on the booking. This used to construct the canister's
   * `serviceId:N` escrow id and probe /api/escrow for twenty of them per card,
   * then hand whatever it found to /api/payments/:paymentId — which never
   * matched, because Postgres payment ids are `pay_…`. The server resolves the
   * booking to its payment now, and it is the only party that can.
   */
  const fetchPayment = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/payments/for-booking/${encodeURIComponent(bookingId)}`);
      const result = await response.json();
      setPayments(prev => ({
        ...prev,
        [bookingId]: result.success ? (result.data as BookingPayment | null) : null,
      }));
    } catch (error) {
      console.error('Error fetching payment for booking:', error);
      setPayments(prev => ({ ...prev, [bookingId]: null }));
    }
  };

  // Release escrow funds using Plug wallet
  const handleRelease = async (e: React.MouseEvent, bookingId: string, paymentId: string) => {
    e.stopPropagation(); // Prevent card click

    if (!confirm('Release this payment? The funds will be transferred to the freelancer.')) {
      return;
    }

    setProcessingPayment(prev => ({ ...prev, [bookingId]: 'releasing' }));

    try {
      // Release is one authenticated request. This previously connected Plug,
      // built an escrow actor from a Candid IDL, read the escrow, worked out
      // the service price and called escrow.release() — roughly 100 lines of
      // wallet plumbing in the browser. Whether the caller may release is
      // decided server-side; only the client who paid can.
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Could not release the payment');
      }

      alert('Payment released to the freelancer.');
      await fetchPayment(bookingId);
    } catch (error: any) {
      console.error('Error releasing payment:', error);
      alert(`Could not release the payment: ${error.message || 'unknown error'}`);
    } finally {
      setProcessingPayment(prev => {
        const newState = { ...prev };
        delete newState[bookingId];
        return newState;
      });
    }
  };

  const handleRefund = async (e: React.MouseEvent, bookingId: string, paymentId: string) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm('Request a refund? The funds will be returned to your original payment method.')) {
      return;
    }

    setProcessingPayment(prev => ({ ...prev, [bookingId]: 'refunding' }));

    try {
      // Same shape as release: the server decides eligibility and how much
      // remains refundable, rather than the browser reading the escrow itself.
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'requested_by_customer' }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Could not refund the payment');
      }

      alert('Payment refunded.');
      await fetchPayment(bookingId);
    } catch (error: any) {
      console.error('Error refunding payment:', error);
      alert(`Could not refund the payment: ${error.message || 'unknown error'}`);
    } finally {
      setProcessingPayment(prev => {
        const newState = { ...prev };
        delete newState[bookingId];
        return newState;
      });
    }
  };

  // Resolve each booking to its payment, so the cards can offer release and
  // refund. One request per booking, and only for bookings not already looked
  // up — the escrow version fired twenty per card on every render of the list.
  useEffect(() => {
    for (const booking of bookings) {
      if (!(booking.booking_id in payments)) {
        fetchPayment(booking.booking_id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings]);


  // Helper function to convert status object to string
  const getStatusString = (status: any): string => {
    if (typeof status === 'string') {
      return status;
    } else if (typeof status === 'object' && status !== null) {
      // Handle canister variant status format like {Active: null}, {Pending: null}, etc.
      const statusKey = Object.keys(status)[0];
      // Normalize to Sentence case for display/comparison if needed, but the filter now handles upper
      return statusKey || 'Pending';
    }
    return 'Pending';
  };

  const getStatusIcon = (status: any) => {
    const statusStr = getStatusString(status);
    switch (statusStr) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'InProgress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Disputed': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'Active': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };


  if (bookingsLoading || jobsLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading projects...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-[#161616]">My Projects</h1>
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Disputed">Disputed</option>
            </select>
          </div>
        </div>

        {(bookingsError || jobsError) && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {bookingsError || jobsError}
          </div>
        )}

        {allProjects.length === 0 && !bookingsLoading && !jobsLoading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No projects found</p>
            <p className="text-gray-400 text-sm mt-2">
              {bookingsError || jobsError
                ? `Error: ${bookingsError || jobsError}`
                : 'Your project list is currently empty.'}
            </p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-md mx-auto">
              <p className="text-sm text-blue-800">
                Projects appear here once you book a service or assign a job.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Projects Grid */}
          {allProjects.length > 0 ? (
            allProjects
              .filter((project) => {
                // The status filter is the only one left. There used to be a
                // second rule here that hid escrow projects until their escrow
                // read as funded — a distinction that only meant something
                // while an ICP escrow could be created and then never paid
                // into. It has also been inert for as long as the escrow
                // lookup has been returning 410, so dropping it changes
                // nothing a user would see.
                return !statusFilter || project.displayStatus === statusFilter;
              })
              .map((project) => {
                const payment = payments[project.id];
                const isProcessing = processingPayment[project.id];

                return (
                  <Card
                    key={project.id}
                    className="border cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:shadow-md overflow-hidden"
                    onClick={() => router.push(`/client/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg line-clamp-2 break-words">
                            {project.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {getStatusIcon(project.status)}
                            <Badge
                              variant={project.displayStatus === 'Completed' ? 'default' : 'secondary'}
                            >
                              {project.displayStatus}
                            </Badge>
                            {project.payment_status && (
                              <Badge
                                variant={getStatusString(project.payment_status) === 'Paid' || getStatusString(project.payment_status) === 'Completed' ? 'default' : 'outline'}
                              >
                                {getStatusString(project.payment_status)}
                              </Badge>
                            )}
                            {project.type === 'job' && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                JOB
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 max-w-[140px]">
                          <div className="text-base font-semibold text-[#0B1F36] truncate">
                            {formatMoney(project.amountMinor, project.currency)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatBookingDateShort(project.createdAt)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {project.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        {project.special_instructions && (
                          <p className="text-sm text-gray-600 line-clamp-2 italic">
                            "{project.special_instructions}"
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 min-w-0">
                          <div className="flex items-center gap-4 min-w-0 flex-1 mr-2">
                            <span className="flex items-center gap-1 min-w-0">
                              <User size={12} className="shrink-0" />
                              <span className="truncate max-w-[180px]">
                                {project.freelancer || 'Awaiting Freelancer'}
                              </span>
                            </span>
                          </div>
                          <span className="text-xs font-mono shrink-0">
                            {project.id.toString().split('_').pop()?.slice(-8)}
                          </span>
                        </div>

                        {/* Only a held payment can be released or refunded. */}
                        {isHeld(payment) && project.displayStatus !== 'Completed' && project.displayStatus !== 'CompletedAndPaid' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Wallet size={14} className="text-purple-600" />
                              <span className="text-xs font-medium text-gray-700">Payment held</span>
                              <Badge variant="default" className="text-xs bg-green-600">
                                {formatMoney(payment!.amount_minor, payment!.currency)}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={(e) => handleRelease(e, project.id, payment!.id)}
                                disabled={!!isProcessing}
                                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                {isProcessing === 'releasing' ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Releasing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle size={14} />
                                    Mark Complete & Release
                                  </>
                                )}
                              </button>
                              <button
                                onClick={(e) => handleRefund(e, project.id, payment!.id)}
                                disabled={!!isProcessing}
                                className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                {isProcessing === 'refunding' ? (
                                  <>
                                    <RefreshCw size={14} className="animate-spin" />
                                    Refunding...
                                  </>
                                ) : (
                                  <>
                                    <ArrowLeft size={14} />
                                    Request Refund
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No projects to display</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
