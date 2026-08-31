'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  X, MessageSquare, ArrowLeft, Clock, CheckCircle,
  AlertCircle, Calendar, User, DollarSign, FileText, Send, Star,
  Plus, History, Link as LinkIcon, ExternalLink, Upload, Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatICP } from '@/lib/ic-marketplace-agent';
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent';

interface BookingDetails {
  booking_id: string;
  client_id: string;
  freelancer_id: string;
  service_id: string;
  service_title: string;
  status: string;
  total_amount_e8s: number;
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

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params?.bookingId as string;

  const [session, setSession] = useState<any>(null);
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ id: string, sender: string, message: string, timestamp: number }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);

  // Deliverables & Status state
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
          router.push('/auth/login');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        router.push('/auth/login');
      }
    };

    fetchSession();
  }, [router]);

  useEffect(() => {
    if (bookingId && session) {
      fetchBookingDetails();
      fetchDeliverables();
      fetchStatusHistory();
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

      if (bookingId.startsWith('job_') || bookingId.startsWith('JOB_')) {
        const jobId = bookingId.replace('job_', '');
        const actor = await getJobMarketplaceActor();
        const result = await actor.getJobById(jobId);

        if (result && result.length > 0) {
          const job = serializeBigInts(result[0]);

          // Map Job to BookingDetails compatible object
          const mappedBooking: BookingDetails = {
            booking_id: `job_${job.id}`,
            client_id: job.clientId,
            freelancer_id: job.freelancerId || '',
            service_id: 'job-marketplace',
            service_title: job.title,
            status: job.status,
            total_amount_e8s: Number(job.budgetAmount),
            total_amount_dollars: 0,
            client_notes: job.description,
            special_instructions: '',
            created_at: Number(job.createdAt) / 1000000, // Convert to ms
            updated_at: Number(job.createdAt) / 1000000,
            delivery_deadline: (Number(job.createdAt) / 1000000) + (7 * 24 * 60 * 60 * 1000), // Dummy deadline: 1 week
            payment_status: (getStatusString(job.status) === 'COMPLETED' || job.isPaid)
              ? 'Paid'
              : (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(getStatusString(job.status)) ? 'HeldInEscrow' : 'Pending'),
            client_review: job.clientReview || undefined,
            client_rating: job.clientRating ? Number(job.clientRating) : undefined,
          };

          if (job.completedAt) {
            mappedBooking.updated_at = Number(job.completedAt) / 1000000;
          }

          // Transform status if it's an object
          if (mappedBooking.status && typeof mappedBooking.status === 'object') {
            mappedBooking.status = Object.keys(mappedBooking.status)[0] || 'Pending';
          }

          setBooking(mappedBooking);
        } else {
          setError('Job project not found');
        }
      } else {
        // Fetch from Service Marketplace
        const response = await fetch(`/api/marketplace/bookings/${bookingId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch booking details');
        }
        const data = await response.json();
        if (data.success) {
          const bookingData = data.data;
          if (bookingData.status && typeof bookingData.status === 'object') {
            bookingData.status = Object.keys(bookingData.status)[0] || 'Pending';
          }
          if (bookingData.payment_status && typeof bookingData.payment_status === 'object') {
            bookingData.payment_status = Object.keys(bookingData.payment_status)[0] || 'Pending';
          }
          setBooking(bookingData);
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

  // Helper to convert status object to string
  const getStatusString = (status: any): string => {
    if (typeof status === 'string') return status;
    if (typeof status === 'object' && status !== null) {
      const keys = Object.keys(status);
      return keys.length > 0 ? keys[0] : 'Pending';
    }
    return 'Pending';
  };

  const getStatusIcon = (status: any) => {
    const statusStr = getStatusString(status);
    switch (statusStr) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'Active': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Paid': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'PAID': return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'Cancelled': return <X className="w-4 h-4 text-red-500" />;
      case 'InDispute': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: any) => {
    const statusStr = getStatusString(status);
    switch (statusStr) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      case 'InDispute': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProjectStage = (status: any) => {
    const statusStr = getStatusString(status);
    switch (statusStr) {
      case 'Pending': return { stage: 1, label: 'Order Placed', completed: true };
      case 'Active': return { stage: 2, label: 'Work in Progress', completed: true };
      case 'Completed': return { stage: 5, label: 'Project Completed', completed: true };
      case 'InDispute': return { stage: 4, label: 'In Dispute', completed: false };
      default: return { stage: 1, label: 'Order Placed', completed: true };
    }
  };

  const handleCompleteProject = async () => {
    try {
      setLoading(true);
      setError('');

      let url = `/api/marketplace/bookings/${bookingId}/complete`;
      let body: any = { freelancerId: session.email };

      if (bookingId.startsWith('job_')) {
        const jobId = bookingId.replace('job_', '');
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
        await fetchBookingDetails(); // Refresh booking details
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
        setBooking(prev => prev ? { ...prev, status: newStatus } : null);
        fetchStatusHistory();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/chat/messages/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderEmail: session.email,
          recipientEmail: booking?.client_id,
          message: newMessage,
          bookingId: bookingId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setChatMessages([...chatMessages, {
            id: Date.now().toString(),
            sender: session.email,
            message: newMessage,
            timestamp: Date.now()
          }]);
          setNewMessage('');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const openChat = () => {
    router.push(`/client/chat?bookingId=${bookingId}&recipient=${booking?.client_id}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading project details...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="flex min-h-screen bg-white">
        <div className="flex-1">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-red-600">{error || 'Project not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  const bookingStatus = getStatusString(booking.status);
  const paymentStatus = getStatusString(booking.payment_status);
  const projectStage = getProjectStage(bookingStatus);
  const stages = [
    { id: 1, label: 'Order Placed', completed: true },
    { id: 2, label: 'Work in Progress', completed: bookingStatus === 'Active' || bookingStatus === 'Completed' || bookingStatus === 'Paid' },
    { id: 3, label: 'Review & Revision', completed: bookingStatus === 'Completed' || bookingStatus === 'Paid' },
    { id: 4, label: 'Final Approval', completed: bookingStatus === 'Completed' || bookingStatus === 'Paid' },
    { id: 5, label: 'Project Completed', completed: bookingStatus === 'Completed' || bookingStatus === 'Paid' },
  ];

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex-1">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Projects
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{booking.service_title}</h1>
                <p className="text-gray-600">Project ID: {booking.booking_id}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={openChat}
                className="flex items-center gap-2"
              >
                <MessageSquare size={18} />
                Chat with Client
              </Button>
              {bookingStatus === 'Active' && (
                <Button
                  onClick={handleCompleteProject}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Complete Project
                </Button>
              )}
            </div>
          </div>

          {/* Status and Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Status</p>
                    <Badge className={getStatusColor(bookingStatus)}>
                      {getStatusIcon(bookingStatus)}
                      <span className="ml-1">{bookingStatus}</span>
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Project Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(() => {
                        const amountE8s = typeof booking.total_amount_e8s === 'bigint'
                          ? Number(booking.total_amount_e8s)
                          : booking.total_amount_e8s || 0;
                        const amountICP = amountE8s / 100000000;
                        return `${amountICP.toFixed(8)} ICP`;
                      })()}
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Deadline</p>
                    <p className="text-sm font-semibold">
                      {new Date(booking.delivery_deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>


          {/* Status Management & Deliverables */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity size={20} />
                  Manage Project Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Update the current status of the project to keep the client informed.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['InProgress', 'Review', 'Revisions', 'Completed'].map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={bookingStatus === s ? 'default' : 'outline'}
                        onClick={() => handleUpdateStatus(s)}
                        disabled={updatingStatus}
                        className={bookingStatus === s ? 'bg-purple-600 text-white' : ''}
                      >
                        {s}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <History size={16} />
                      Status History
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      {statusHistory.length > 0 ? (
                        statusHistory.map((h, i) => (
                          <div key={i} className="flex gap-3 text-sm">
                            <div className="shrink-0 w-2 h-2 mt-1.5 rounded-full bg-blue-400"></div>
                            <div>
                              <p className="font-bold">{h.status}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(h.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic">No status updates yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deliverables Submission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus size={20} />
                  Submit Deliverables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitDeliverable} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Title</label>
                    <input
                      type="text"
                      className="w-full p-2 text-sm border border-gray-200 rounded-md"
                      placeholder="e.g., Final Logo Files"
                      value={deliverableForm.title}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
                    <textarea
                      className="w-full p-2 text-sm border border-gray-200 rounded-md h-20"
                      placeholder="Add any instructions or notes for the client..."
                      value={deliverableForm.notes}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, notes: e.target.value })}
                    ></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Upload File</label>
                      <div className="relative">
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
                          className="w-full flex items-center gap-2"
                          onClick={() => document.getElementById('file-upload')?.click()}
                        >
                          <Upload size={16} />
                          {selectedFile ? 'File Selected' : 'Choose File'}
                        </Button>
                        {selectedFile && (
                          <p className="text-[10px] text-gray-500 mt-1 truncate">
                            {selectedFile.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-1 block">Or Link</label>
                      <input
                        type="text"
                        className="w-full p-2 text-sm border border-gray-200 rounded-md"
                        placeholder="e.g., Figma Link"
                        value={deliverableForm.link}
                        onChange={(e) => setDeliverableForm({ ...deliverableForm, link: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={submittingDeliverable}
                  >
                    {submittingDeliverable ? 'Submitting...' : 'Submit Deliverable'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Deliverables History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText size={20} />
                Submitted Deliverables
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deliverables.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliverables.map((d) => (
                    <div key={d.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 shrink-0 bg-white rounded-lg flex items-center justify-center border border-gray-100">
                          {d.file_type === 'link' ? <LinkIcon size={20} className="text-blue-500" /> : <FileText size={20} className="text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{d.title || d.file_name}</p>
                          <p className="text-xs text-gray-500">{new Date(d.created_at).toLocaleDateString()} • {d.file_type === 'link' ? 'Shared Link' : 'Uploaded File'}</p>
                        </div>
                      </div>

                      {d.notes && (
                        <div className="text-xs text-gray-600 bg-white/50 p-2 rounded border border-gray-100 italic">
                          {d.notes}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-200/50">
                        <a
                          href={(() => {
                            const url = d.file_url || '';
                            if (url.startsWith('http://') || url.startsWith('https://')) return url;
                            return `https://${url}`;
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-600 font-bold hover:underline"
                        >
                          {d.file_type === 'link' ? 'Open Link' : 'Download File'}
                          <ExternalLink size={12} />
                        </a>
                        {d.file_type !== 'link' && d.file_size && (
                          <span className="text-[10px] text-gray-400">
                            {(d.file_size / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="text-gray-400" size={32} />
                  </div>
                  <p className="text-gray-500 text-sm italic">No deliverables submitted yet.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Details */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User size={20} />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Client ID</p>
                    <p className="font-medium">{booking.client_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Project Started</p>
                    <p className="font-medium">{new Date(booking.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText size={20} />
                  Project Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {booking.client_notes && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Client Notes</p>
                      <p className="text-sm bg-gray-50 p-3 rounded">{booking.client_notes}</p>
                    </div>
                  )}
                  {booking.special_instructions && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Special Instructions</p>
                      <p className="text-sm bg-gray-50 p-3 rounded">{booking.special_instructions}</p>
                    </div>
                  )}
                  {!booking.client_notes && !booking.special_instructions && (
                    <p className="text-gray-500 text-sm">No additional requirements provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Client Review Section */}
          {!!booking.client_rating && !!booking.client_review && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star size={20} className="text-yellow-500 fill-yellow-500" />
                  Client Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Rating Display */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={24}
                          className={
                            star <= (booking.client_rating || 0)
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }
                        />
                      ))}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {booking.client_rating} out of 5
                    </div>
                  </div>

                  {/* Review Comment */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Client's Feedback:</p>
                    <p className="text-gray-900 whitespace-pre-wrap">{booking.client_review}</p>
                  </div>

                  <div className="text-xs text-gray-500">
                    Review from: {booking.client_id}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  );
}