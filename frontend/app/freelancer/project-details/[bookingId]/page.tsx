'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  X, MessageSquare, ArrowLeft, Clock, CheckCircle,
  AlertCircle, Calendar, User, DollarSign, FileText, Star,
  Plus, History, Link as LinkIcon, ExternalLink, Upload, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMoney } from '@/lib/currency';
import { getJob } from '@/lib/api/jobs';

interface BookingDetails {
  booking_id: string;
  client_id: string;
  freelancer_id: string;
  service_id: string;
  service_title: string;
  status: string;
  total_minor: number;
  total_amount_dollars: number;
  client_notes: string;
  special_instructions: string;
  created_at: number;
  updated_at: number;
  delivery_deadline: number;
  payment_status: string;
  client_review?: string;
  client_rating?: number;
}

/** Legal freelancer-initiated transitions from the current booking status (mirrors backend TRANSITIONS/TRANSITION_ACTOR). */
const FREELANCER_STATUS_ACTIONS: Record<string, { value: string; label: string }[]> = {
  Pending: [{ value: 'active', label: 'Start work' }],
  Active: [{ value: 'in_dispute', label: 'Raise dispute' }],
  InDispute: [{ value: 'active', label: 'Resolve to active' }],
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;
  const isJobBooking = bookingId?.startsWith('job_') || bookingId?.startsWith('JOB_');

  const [session, setSession] = useState<any>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deliverableForm, setDeliverableForm] = useState({ title: '', notes: '', link: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        if (data.success && data.session) {
          setSession(data.session);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        router.push('/login');
      }
    };

    fetchSession();
  }, [router]);

  useEffect(() => {
    if (bookingId && session) {
      fetchBookingDetails();
      if (!isJobBooking) {
        fetchDeliverables();
        fetchStatusHistory();
      }
    }
  }, [bookingId, session]);

  const fetchDeliverables = async () => {
    try {
      const response = await fetch(`/api/marketplace/deliverables?bookingId=${bookingId}`);
      const data = await response.json();
      if (data.success) {
        setDeliverables(data.data);
      }
    } catch (error) {
      console.error('Error fetching deliverables:', error);
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const response = await fetch(`/api/marketplace/bookings/${bookingId}/status`);
      const data = await response.json();
      if (data.success) {
        setStatusHistory(data.data);
      }
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError('');

      if (isJobBooking) {
        const jobId = bookingId.replace(/^job_/i, '');
        const job = await getJob(jobId);

        if (job) {
          const statusUpper = (job.status || '').toUpperCase();
          const mappedBooking: BookingDetails = {
            booking_id: `job_${job.id}`,
            client_id: job.client_name || job.clientId,
            freelancer_id: job.freelancerId || '',
            service_id: 'job-marketplace',
            service_title: job.title,
            status: statusUpper === 'ASSIGNED' ? 'Active' : statusUpper === 'COMPLETED' || statusUpper === 'PAID' ? 'Completed' : job.status,
            total_minor: Number(job.budget_minor),
            total_amount_dollars: 0,
            client_notes: job.description,
            special_instructions: '',
            created_at: new Date(job.createdAt).getTime(),
            updated_at: new Date(job.createdAt).getTime(),
            delivery_deadline: new Date(job.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000, // Estimated: 1 week
            payment_status: statusUpper === 'PAID' || job.isPaid
              ? 'Paid'
              : (statusUpper === 'ASSIGNED' || statusUpper === 'COMPLETED') ? 'HeldInEscrow' : 'Pending',
            client_review: job.clientReview || undefined,
            client_rating: job.clientRating ? Number(job.clientRating) : undefined,
          };

          if (job.completedAt) {
            mappedBooking.updated_at = new Date(job.completedAt).getTime();
          }

          setBooking(mappedBooking);
        } else {
          setError('Job project not found');
        }
      } else {
        const response = await fetch(`/api/marketplace/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }
        const data = await response.json();
        if (data.success) {
          setBooking(data.data);
        } else {
          setError(data.error || 'Failed to load booking details');
        }
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProject = async () => {
    try {
      setLoading(true);
      setError('');

      let url = `/api/marketplace/bookings/${bookingId}/complete`;
      let body: any = { freelancerId: session.email };

      if (isJobBooking) {
        const jobId = bookingId.replace(/^job_/i, '');
        url = `/api/marketplace/job-posts/${jobId}/complete`;
        body = { freelancerId: session.email };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to complete project');
      }

      const data = await response.json();
      if (data.success) {
        await fetchBookingDetails();
      } else {
        setError(data.error || 'Failed to complete project');
      }
    } catch (error: any) {
      console.error('Error completing project:', error);
      setError(error.message || 'Failed to complete project');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliverableForm.link && !selectedFile) {
      alert('Please provide a file or a link');
      return;
    }

    try {
      setSubmittingDeliverable(true);
      const formData = new FormData();
      formData.append('bookingId', bookingId);
      formData.append('title', deliverableForm.title);
      formData.append('notes', deliverableForm.notes);
      if (selectedFile) formData.append('file', selectedFile);
      if (deliverableForm.link) formData.append('link', deliverableForm.link);

      const response = await fetch('/api/marketplace/deliverables', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setDeliverableForm({ title: '', notes: '', link: '' });
        setSelectedFile(null);
        fetchDeliverables();
        fetchStatusHistory();
      } else {
        alert(data.error || 'Failed to submit deliverable');
      }
    } catch (error) {
      console.error('Error submitting deliverable:', error);
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setUpdatingStatus(true);
      const response = await fetch(`/api/marketplace/bookings/${bookingId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, notes: `Status changed to ${newStatus}` }),
      });

      const data = await response.json();
      if (data.success) {
        await fetchBookingDetails();
        fetchStatusHistory();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const openChat = () => {
    router.push(`/freelancer/messages?with=${booking?.client_id}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton className="mb-6 h-8 w-64" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <EmptyState icon={AlertCircle} title={error || 'Project not found'} />
      </div>
    );
  }

  const bookingStatus = booking.status;
  const availableActions = isJobBooking ? [] : (FREELANCER_STATUS_ACTIONS[bookingStatus] || []);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
            Back to projects
          </Button>
          <div>
            <h1 className="font-heading text-h2 font-semibold text-foreground">{booking.service_title}</h1>
            <p className="text-sm text-muted-foreground">Project ID: {booking.booking_id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={openChat}>
            <MessageSquare className="size-4" />
            Chat with client
          </Button>
          {bookingStatus === 'Active' && (
            <Button onClick={handleCompleteProject} className="bg-success text-success-foreground hover:bg-success/90">
              Complete project
            </Button>
          )}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <StatusBadge status={bookingStatus} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Project value</p>
              <p className="text-2xl font-bold text-foreground">{formatMoney(booking.total_minor)}</p>
            </div>
            <DollarSign className="size-8 text-success" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Deadline</p>
              <p className="text-sm font-semibold text-foreground">
                {new Date(booking.delivery_deadline).toLocaleDateString()}
              </p>
            </div>
            <Calendar className="size-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {!isJobBooking && (
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5" />
                Manage project status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="mb-4 text-sm text-muted-foreground">
                  Update the current status of the project to keep the client informed.
                </p>
                {availableActions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {availableActions.map((action) => (
                      <Button
                        key={action.value}
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdateStatus(action.value)}
                        disabled={updatingStatus}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No status changes available right now.</p>
                )}

                <div className="mt-6 border-t border-border pt-6">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                    <History className="size-4" />
                    Status history
                  </h4>
                  <div className="max-h-48 space-y-3 overflow-y-auto pr-2">
                    {statusHistory.length > 0 ? (
                      statusHistory.map((h, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                          <div>
                            <p className="font-semibold text-foreground">{h.status}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(h.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic text-muted-foreground">No status updates yet</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="size-5" />
                Submit deliverables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deliverableTitle">Title</Label>
                  <Input
                    id="deliverableTitle"
                    placeholder="e.g., Final logo files"
                    value={deliverableForm.title}
                    onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="deliverableNotes">Notes (optional)</Label>
                  <Textarea
                    id="deliverableNotes"
                    className="h-20 resize-none"
                    placeholder="Add any instructions or notes for the client..."
                    value={deliverableForm.notes}
                    onChange={(e) => setDeliverableForm({ ...deliverableForm, notes: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Upload file</Label>
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="size-4" />
                      {selectedFile ? 'File selected' : 'Choose file'}
                    </Button>
                    {selectedFile && (
                      <p className="truncate text-[10px] text-muted-foreground">{selectedFile.name}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="deliverableLink">Or link</Label>
                    <Input
                      id="deliverableLink"
                      placeholder="e.g., Figma link"
                      value={deliverableForm.link}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, link: e.target.value })}
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={submittingDeliverable}>
                  {submittingDeliverable ? 'Submitting...' : 'Submit deliverable'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {!isJobBooking && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Submitted deliverables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliverables.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {deliverables.map((d) => (
                  <div key={d.id} className="flex flex-col gap-3 rounded-lg border border-border bg-secondary p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-surface">
                        {d.file_type === 'link' ? <LinkIcon className="size-5 text-primary" /> : <FileText className="size-5 text-primary" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">{d.title || d.file_name}</p>
                        <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString()} &middot; {d.file_type === 'link' ? 'Shared link' : 'Uploaded file'}</p>
                      </div>
                    </div>

                    {d.notes && (
                      <div className="rounded border border-border bg-surface/50 p-2 text-xs italic text-muted-foreground">
                        {d.notes}
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between border-t border-border pt-2">
                      <a
                        href={(() => {
                          const url = d.file_url || '';
                          if (url.startsWith('http://') || url.startsWith('https://')) return url;
                          return `https://${url}`;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                      >
                        {d.file_type === 'link' ? 'Open link' : 'Download file'}
                        <ExternalLink className="size-3" />
                      </a>
                      {d.file_type !== 'link' && d.file_size && (
                        <span className="text-[10px] text-muted-foreground">
                          {(d.file_size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={FileText} title="No deliverables submitted yet" />
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Client information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-medium text-foreground">{booking.client_id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Project started</p>
                <p className="font-medium text-foreground">{new Date(booking.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5" />
              Project requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {booking.client_notes && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Client notes</p>
                  <p className="rounded bg-secondary p-3 text-sm text-foreground">{booking.client_notes}</p>
                </div>
              )}
              {booking.special_instructions && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Special instructions</p>
                  <p className="rounded bg-secondary p-3 text-sm text-foreground">{booking.special_instructions}</p>
                </div>
              )}
              {!booking.client_notes && !booking.special_instructions && (
                <p className="text-sm text-muted-foreground">No additional requirements provided</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {!!booking.client_rating && !!booking.client_review && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5 fill-warning text-warning" />
              Client review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-5 ${star <= (booking.client_rating || 0) ? 'fill-warning text-warning' : 'text-border'}`}
                    />
                  ))}
                </div>
                <div className="text-lg font-semibold text-foreground">
                  {booking.client_rating} out of 5
                </div>
              </div>

              <div className="rounded-lg border border-border bg-secondary p-4">
                <p className="mb-2 text-sm text-muted-foreground">Client&apos;s feedback:</p>
                <p className="whitespace-pre-wrap text-foreground">{booking.client_review}</p>
              </div>

              <div className="text-xs text-muted-foreground">
                Review from: {booking.client_id}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
