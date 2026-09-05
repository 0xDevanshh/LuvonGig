'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBookings, useJobProjects } from '@/hooks/useMarketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/currency';
import { formatBookingDateShort } from '@/lib/date-utils';
import {
  CheckCircle,
  User,
  RefreshCw,
  Wallet,
  ArrowLeft,
  Briefcase
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
        const status = getStatusString(j.status).toUpperCase();
        return status === 'ASSIGNED' || status === 'COMPLETED' || status === 'PAID';
      })
      .map((j: any) => ({
        ...j,
        id: `job_${j.id}`,
        title: j.title || 'Job Project',
        type: 'job',
        displayStatus: getStatusString(j.status).toUpperCase() === 'ASSIGNED' ? 'Active' : 'Completed',
        // toJobDto sends budget_minor; `budgetAmount` never existed on it and
        // rendered every job card as "NaN ICP".
        amountMinor: j.budget_minor,
        currency: j.currency || 'USD',
        createdAt: Number(new Date(j.createdAt)),
        freelancer: j.freelancer_email || j.freelancerId,
        payment_status: getStatusString(j.status).toUpperCase() === 'PAID' ? 'Paid' : 'HeldInEscrow',
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
          setUserId(data.session.email); // Use email for service bookings
          setJobUserId(data.session.userId || data.session.email); // Use 8-char ID, fallout to email
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('ClientProjects: Error fetching session:', error);
        router.push('/login');
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

  // Release escrow funds held via Stripe.
  const handleRelease = async (e: React.MouseEvent, bookingId: string, paymentId: string) => {
    e.stopPropagation(); // Prevent card click

    if (!confirm('Release this payment? The funds will be transferred to the freelancer.')) {
      return;
    }

    setProcessingPayment(prev => ({ ...prev, [bookingId]: 'releasing' }));

    try {
      // Release is one authenticated request. Whether the caller may release
      // is decided server-side; only the client who paid can.
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
      const statusKey = Object.keys(status)[0];
      return statusKey || 'Pending';
    }
    return 'Pending';
  };

  if (bookingsLoading || jobsLoading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-9 w-64" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-52" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title="My projects"
        actions={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          >
            <option value="">All status</option>
            <option value="Pending">Pending</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="InDispute">In dispute</option>
          </select>
        }
      />

      {(bookingsError || jobsError) && (
        <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {bookingsError || jobsError}
        </div>
      )}

      <div className="mt-6">
        {allProjects.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No projects found"
            description="Projects appear here once you book a service or assign a job."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {allProjects
              .filter((project) => !statusFilter || project.displayStatus === statusFilter)
              .map((project) => {
                const payment = payments[project.id];
                const isProcessing = processingPayment[project.id];

                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer overflow-hidden transition-colors hover:border-primary"
                    onClick={() => router.push(`/client/projects/${project.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="line-clamp-2 break-words text-base">
                            {project.title}
                          </CardTitle>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <StatusBadge status={project.displayStatus} />
                            {project.payment_status && (
                              <StatusBadge status={getStatusString(project.payment_status)} />
                            )}
                            {project.type === 'job' && (
                              <Badge variant="outline" className="text-xs">
                                Job
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="max-w-[140px] shrink-0 text-right">
                          <div className="truncate text-base font-semibold text-foreground">
                            {formatMoney(project.amountMinor, project.currency)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatBookingDateShort(project.createdAt)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {project.description && (
                          <p className="line-clamp-2 text-sm text-muted-foreground">
                            {project.description}
                          </p>
                        )}
                        {project.special_instructions && (
                          <p className="line-clamp-2 text-sm italic text-muted-foreground">
                            &ldquo;{project.special_instructions}&rdquo;
                          </p>
                        )}

                        <div className="flex min-w-0 items-center justify-between text-xs text-muted-foreground">
                          <span className="flex min-w-0 flex-1 items-center gap-1 pr-2">
                            <User className="size-3 shrink-0" />
                            <span className="max-w-[180px] truncate">
                              {project.freelancer || 'Awaiting freelancer'}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-xs">
                            {project.id.toString().split('_').pop()?.slice(-8)}
                          </span>
                        </div>

                        {/* Only a held payment can be released or refunded. */}
                        {isHeld(payment) && project.displayStatus !== 'Completed' && (
                          <div className="mt-4 border-t border-border pt-4">
                            <div className="mb-3 flex items-center gap-2">
                              <Wallet className="size-3.5 text-primary" />
                              <span className="text-xs font-medium text-foreground">Payment held</span>
                              <Badge className="text-xs">
                                {formatMoney(payment!.amount_minor, payment!.currency)}
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <Button
                                onClick={(e) => handleRelease(e, project.id, payment!.id)}
                                disabled={!!isProcessing}
                                className="w-full bg-success text-success-foreground hover:bg-success/90"
                              >
                                {isProcessing === 'releasing' ? (
                                  <>
                                    <RefreshCw className="size-3.5 animate-spin" />
                                    Releasing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="size-3.5" />
                                    Mark complete & release
                                  </>
                                )}
                              </Button>
                              <Button
                                onClick={(e) => handleRefund(e, project.id, payment!.id)}
                                disabled={!!isProcessing}
                                variant="outline"
                                className="w-full border-warning/30 text-warning hover:bg-warning/10"
                              >
                                {isProcessing === 'refunding' ? (
                                  <>
                                    <RefreshCw className="size-3.5 animate-spin" />
                                    Refunding...
                                  </>
                                ) : (
                                  <>
                                    <ArrowLeft className="size-3.5" />
                                    Request refund
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
