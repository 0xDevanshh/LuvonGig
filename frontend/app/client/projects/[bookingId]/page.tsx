'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import ProjectDetailHeader from '@/components/ProjectDetailHeader';
import ProjectTimeline from '@/components/ProjectTimeline';
import FinancialInformation from '@/components/FinancialInformation';
import DocumentManager from '@/components/DocumentManager';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  DollarSign,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  FileText,
  Settings,
  Activity,
  ArrowLeft,
  History,
  Plus,
  Link as LinkIcon,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatBookingDate, formatBookingDateShort, formatRelativeTime, isOverdue, getTimeRemaining } from '@/lib/date-utils';
import { useBookings, useStages, useJobProjects } from '@/hooks/useMarketplace';
import { getJob } from '@/lib/api/jobs';
import { ReviewModal } from '@/components/ReviewModal';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.bookingId as string;

  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string>('');
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [releasing, setReleasing] = useState(false);
  const [refunding, setRefunding] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Deliverables & Status state
  const [deliverables, setDeliverables] = useState<any[]>([]);
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  const {
    stages,
    loading: stagesLoading,
    error: stagesError,
    approveStage,
    rejectStage
  } = useStages(bookingId);

  // Fetch current session on component mount
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data.success && data.session) {
          setSession(data.session);
          setUserId(data.session.email);
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

  const [freelancerFee, setFreelancerFee] = useState<number>(0.04);

  // Fetch project details function
  const fetchProjectDetails = useCallback(async () => {
    if (!bookingId || !userId) return;

    try {
      setLoading(true);

      let projectData: any = null;

      // Handle Job Marketplace projects (ID starts with job_)
      if (bookingId.startsWith('job_')) {
        const jobId = bookingId.replace('job_', '');
        console.log('🔍 Fetching Job Marketplace project:', jobId);

        // The API returns the job directly; Candid wrapped an optional as a
        // one-or-zero element array, hence the old length check.
        const serializedJob = await getJob(jobId);

        if (serializedJob) {

          // Normalize job to look like a booking for the UI
          projectData = {
            ...serializedJob,
            booking_id: `job_${serializedJob.id}`,
            service_id: serializedJob.id,
            service_title: serializedJob.title,
            freelancer_email: serializedJob.freelancerId,
            freelancer_id: serializedJob.freelancerId,
            total_minor: serializedJob.budget_minor,
            base_amount_minor: serializedJob.budget_minor,
            status: serializedJob.status,
            payment_status: (getStatusString(serializedJob.status) === 'PAID' || serializedJob.isPaid)
              ? 'Paid'
              : (['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(getStatusString(serializedJob.status)) ? 'HeldInEscrow' : 'Pending'),
            payment_method: 'escrow',
            created_at: serializedJob.createdAt,
            description: serializedJob.description,
            client_review: serializedJob.clientReview || undefined,
            client_rating: serializedJob.clientRating ? Number(serializedJob.clientRating) : undefined,
            isJob: true
          };

          console.log(`🔍 [LOG] Final mapped payment_status:`, projectData.payment_status);
          setProject(projectData);
          setError(null);
        } else {
          setError('Job not found');
        }
      } else {
        // Handle regular service marketplace bookings
        const response = await fetch(`/api/marketplace/bookings/${bookingId}`);
        const data = await response.json();

        if (data.success) {
          projectData = data.data;
          setProject(projectData);
          setError(null);
        } else {
          setError(data.error || 'Failed to fetch project details');
        }
      }

      // Fetch Freelancer's Plan Fee if project was found
      if (projectData) {
        try {
          const freelancerEmail = projectData.freelancer_email || projectData.freelancer_id;
          if (freelancerEmail) {
            const subResponse = await fetch(`/api/subscription?email=${encodeURIComponent(freelancerEmail)}`);
            const subResult = await subResponse.json();
            if (subResult.success && subResult.data) {
              setFreelancerFee(subResult.data.marketplace_fee);
              console.log('✅ Freelancer fee found for project:', subResult.data.marketplace_fee);
            }
          }
        } catch (feeError) {
          console.warn('⚠️ Could not fetch freelancer fee for project:', feeError);
        }
      }

    } catch (error) {
      console.error('Error fetching project details:', error);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  }, [bookingId, userId]);

  // Fetch project details on mount or when bookingId/userId changes
  useEffect(() => {
    fetchProjectDetails();
    fetchDeliverables();
    fetchStatusHistory();
  }, [fetchProjectDetails]);

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



  const handleApproveStage = async (stageId: string) => {
    if (!userId) return;

    if (confirm('Are you sure you want to approve this stage? This will release the funds to the freelancer.')) {
      await approveStage(userId, stageId);
    }
  };

  const handleRejectStage = async (stageId: string, reason: string) => {
    if (!userId) return;

    if (reason.trim()) {
      await rejectStage(userId, stageId, reason);
    }
  };

  const handleChatWithFreelancer = () => {
    if (project?.freelancer_email) {
      // Redirect to the correct chat URL with the freelancer's email
      window.location.href = `http://localhost:3001/client/chat?with=${encodeURIComponent(project.freelancer_email)}`;
    }
  };

  const handleViewTransaction = () => {
    if (project?.payment_id) {
      // For now, just copy the payment ID to clipboard
      // In a real implementation, this could open a blockchain explorer
      navigator.clipboard.writeText(project.payment_id);
      alert('Payment ID copied to clipboard!');
    }
  };

  const handleUploadDocument = async (files: FileList, stageId?: string) => {
    // Mock document upload implementation
    const newDocuments = Array.from(files).map((file, index) => ({
      id: `doc_${Date.now()}_${index}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' :
        file.type.startsWith('video/') ? 'video' :
          file.name.endsWith('.zip') || file.name.endsWith('.rar') ? 'archive' : 'document',
      size: file.size,
      uploadedBy: session?.email || 'Current User',
      uploadedAt: Date.now() * 1000000, // Convert to nanoseconds
      stageId: stageId,
      description: `Uploaded document: ${file.name}`,
      url: URL.createObjectURL(file)
    }));

    setDocuments(prev => [...prev, ...newDocuments]);
    alert(`Successfully uploaded ${files.length} document(s)!`);
  };

  const handleViewDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
    } else {
      alert('Document preview not available');
    }
  };

  const handleDownloadDocument = (document: any) => {
    // Mock download implementation
    alert(`Downloading: ${document.name}`);
  };

  // Helper to get status string
  const getStatusString = (status: any): string => {
    if (typeof status === 'string') return status;
    if (typeof status === 'object' && status !== null) {
      const statusKey = Object.keys(status)[0];
      return statusKey || 'Pending';
    }
    return 'Pending';
  };

  /**
   * The payment id for this booking, asked of the server.
   *
   * This used to guess: escrow_account, then payment_id, then transaction_id,
   * then a constructed `serviceId:0` — all shaped like the canister's escrow
   * ids, all of which 404 against `pay_…` Postgres ids. Payments reference
   * bookings rather than the reverse, so the server is the only party that can
   * answer this.
   */
  const resolvePaymentId = async (): Promise<string | null> => {
    if (!project) return null;
    try {
      const res = await fetch(
        `/api/payments/for-booking/${encodeURIComponent(bookingId)}`,
      );
      const body = await res.json();
      if (!res.ok || !body.success) return null;
      return (body.data?.id as string | undefined) ?? null;
    } catch (err) {
      console.error('Error resolving payment for booking:', err);
      return null;
    }
  };

  // Helper to mark status and paid after release
  const markAsCompletedAndPaidAfterRelease = async () => {
    try {
      // 1. Update status history
      const statusUpdateBody = {
        status: 'Completed',
        notes: 'Project completed and funds released from escrow'
      };

      try {
        await fetch(`/api/marketplace/bookings/${bookingId}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(statusUpdateBody),
        });
      } catch (e) {
        // Non-critical — status history update failed
      }

      // 2. Update canister state based on booking type
      if (bookingId.startsWith('job_')) {
        const jobId = bookingId.replace('job_', '');
        try {
          const paidResponse = await fetch(`/api/marketplace/job-posts/${jobId}/paid`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ clientId: project?.clientId || userId }),
          });

          if (!paidResponse.ok) {
            const errorData = await paidResponse.json();
            console.error('Failed to mark job as paid:', errorData.error);
            alert(`Note: Payment released but status update failed: ${errorData.error}`);
          }
        } catch (paidError) {
          console.error('Error calling paid API:', paidError);
        }
      } else {
        try {
          const paidResponse = await fetch('/api/marketplace/bookings/paid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ bookingId, clientId: userId }),
          });

          if (!paidResponse.ok) {
            const errorData = await paidResponse.json();
            console.error('Failed to mark booking as paid:', errorData.error);
            alert(`Note: Payment released but status update failed: ${errorData.error}`);
          }
        } catch (paidError) {
          console.error('Error calling paid API:', paidError);
        }
      }

      // 3. Optimistically update local state so UI shows "Paid" immediately
      if (project) {
        setProject((prev: any) => ({
          ...prev,
          payment_status: 'Paid',
          status: 'Paid',
        }));
      }

      // 4. Refresh project details from canister
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error in markAsCompletedAndPaidAfterRelease:', error);
    }
  };

  const handleReleaseFunds = async () => {
    if (!confirm('Release the payment to the freelancer? This cannot be undone.')) {
      return;
    }

    setLoading(true);

    try {
      const paymentId = await resolvePaymentId();
      if (!paymentId) {
        throw new Error('This booking has no payment to release.');
      }

      // One authenticated request. This previously connected Plug, built an
      // escrow actor from a Candid IDL, read the escrow and treasury, then
      // called escrow.release() — over a hundred lines of wallet plumbing in
      // the browser. Eligibility is decided server-side now.
      const res = await fetch(`/api/payments/${encodeURIComponent(paymentId)}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.error || 'Could not release the payment');
      }

      alert('Payment released to the freelancer.');
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error releasing funds:', error);
      alert(error instanceof Error ? error.message : 'Could not release the payment.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefundFunds = async () => {
    if (!confirm('Request a refund? The funds will be returned to your original payment method.')) {
      return;
    }

    setRefunding(true);

    try {
      const paymentId = await resolvePaymentId();
      if (!paymentId) {
        throw new Error('This booking has no payment to refund.');
      }

      // Same as release: one authenticated request. The browser no longer
      // connects a wallet, builds an escrow actor, or hunts for the escrow id
      // across candidate values — the server knows which payment this is and
      // how much of it remains refundable.
      //
      // The Plug-wallet gate that used to stand in front of this refused the
      // refund outright unless an ICP wallet was installed and connected,
      // months after the money stopped moving over ICP.
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
      await fetchProjectDetails();
    } catch (error) {
      console.error('Error refunding:', error);
      alert(error instanceof Error ? error.message : 'Could not refund the payment.');
    } finally {
      setRefunding(false);
    }
  };

  // Handle mark as complete
  const handleMarkAsComplete = async () => {
    if (!confirm('Are you sure you want to mark this project as complete?')) {
      return;
    }

    setCompleting(true);
    try {
      const response = await fetch(`/api/marketplace/bookings/${bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          freelancerId: project?.clientId || userId, // Use clientId from project if available, fallback to userId
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Project marked as complete!');
        // Refresh project details
        fetchProjectDetails();
      } else {
        alert(`Failed to mark as complete: ${data.error}`);
      }
    } catch (error) {
      console.error('Error marking as complete:', error);
      alert('Failed to mark as complete. Please try again.');
    } finally {
      setCompleting(false);
    }
  };

  // Handle review submission
  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!userId || !bookingId) {
      throw new Error('User ID or Booking ID is missing');
    }

    setSubmittingReview(true);
    try {
      let url = `/api/marketplace/bookings/${bookingId}/review`;
      let body: any = {
        userId: userId,
        rating: rating,
        comment: comment,
        isClient: true,
      };

      if (bookingId.startsWith('job_')) {
        const jobId = bookingId.replace('job_', '');
        url = `/api/marketplace/job-posts/${jobId}/review`;
        // Body is the same structure for both
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        console.log('✅ Review submitted successfully');
        setShowReviewModal(false);
        // Refresh project details to show the review
        await fetchProjectDetails();
        alert('Thank you for your review! Your feedback helps improve our platform.');
      } else {
        throw new Error(data.error || 'Failed to submit review');
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      throw error;
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">

        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading project details...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Project</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">


      <main className="flex-1 container mx-auto px-4 py-6">
        {/* Header with navigation */}
        <ProjectDetailHeader
          project={project}
          onChatWithFreelancer={handleChatWithFreelancer}
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Project Overview */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="progress">Progress</TabsTrigger>
                <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
                <TabsTrigger value="communication">Communication</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Service Details</h3>
                      <p className="text-gray-600">{project.service_title || project.package_details?.service_title}</p>
                      {project.package_title && (
                        <p className="text-sm text-gray-500">
                          {project.package_tier && `${project.package_tier.charAt(0).toUpperCase() + project.package_tier.slice(1)} Package`} • {project.package_title}
                        </p>
                      )}
                    </div>

                    {project.package_details && (
                      <div>
                        <h3 className="font-medium mb-2">Package Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Package ID:</span>
                            <span className="text-sm font-mono">{project.package_details.package_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Service ID:</span>
                            <span className="text-sm font-mono">{project.package_details.service_id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Delivery Time:</span>
                            <span className="text-sm">
                              {project.delivery_days
                                ? (project.delivery_days === 1 ? '1 day' : `${project.delivery_days} days`)
                                : project.package_details?.delivery_time_days
                                  ? (project.package_details.delivery_time_days === 1 ? '1 day' : `${project.package_details.delivery_time_days} days`)
                                  : project.package_delivery_days
                                    ? (project.package_delivery_days === 1 ? '1 day' : `${project.package_delivery_days} days`)
                                    : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Starting Price:</span>
                            <div className="text-right">
                              {/* USD pricing hidden as requested */}
                              {/* {project.package_details.starting_from_usd && (
                                <div className="text-sm text-green-600">${project.package_details.starting_from_usd.toFixed(2)} USD</div>
                              )} */}
                            </div>
                          </div>
                          {project.package_details.service_category && (
                            <div className="flex justify-between">
                              <span className="text-sm text-gray-600">Category:</span>
                              <span className="text-sm">{project.package_details.service_category}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-medium mb-2">Special Instructions</h3>
                      <p className="text-gray-600">{project.special_instructions || 'No special instructions provided'}</p>
                    </div>

                    <div>
                      <h3 className="font-medium mb-2">Freelancer</h3>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span>{project.freelancer_name || project.freelancer_id}</span>
                      </div>
                    </div>

                    {/* Only show delivery deadline if project is not completed */}
                    {project.delivery_deadline && getStatusString(project.status) !== 'Completed' && (
                      <div>
                        <h3 className="font-medium mb-2">Delivery Deadline</h3>
                        <div className={`flex items-center gap-2 ${isOverdue(project.delivery_deadline) ? 'text-red-600' : 'text-orange-600'}`}>
                          <Calendar className="w-4 h-4" />
                          <span>{formatBookingDateShort(project.delivery_deadline)}</span>
                          {isOverdue(project.delivery_deadline) && (
                            <span className="ml-2 text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded">
                              OVERDUE
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {getTimeRemaining(project.delivery_deadline)}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="progress" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="w-5 h-5 text-blue-600" />
                      Project Progress Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {statusHistory.length > 0 ? (
                        statusHistory.map((h, i) => (
                          <div key={i} className="relative pl-8 pb-6 last:pb-0">
                            {i !== statusHistory.length - 1 && (
                              <div className="absolute left-3 top-3 bottom-0 w-0.5 bg-gray-100"></div>
                            )}
                            <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-white bg-blue-500 shadow-sm flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white"></div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                              <div className="flex justify-between items-start mb-1">
                                <p className="font-bold text-gray-900 text-base">{h.status}</p>
                                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                                  {new Date(h.created_at).toLocaleString()}
                                </span>
                              </div>
                              {h.notes && (
                                <p className="text-sm text-gray-600 mt-2 bg-blue-50/50 p-2 rounded italic font-medium">
                                  "{h.notes}"
                                </p>
                              )}
                              <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                <User size={10} />
                                {h.updated_by}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Activity className="w-12 h-12 mx-auto mb-4 text-gray-200" />
                          <p className="text-gray-500">No progress activity recorded yet.</p>
                          <p className="text-xs text-gray-400 mt-1">Status updates from the freelancer will appear here.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Keep original stages if needed for reference, or hide if user prefers strictly DB progress */}
                {/* For now, we strictly follow the request: "instead show the progress from the db" */}
              </TabsContent>

              <TabsContent value="deliverables" className="space-y-6">
                {/* Submitted Deliverables from Programmer */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText size={20} className="text-purple-600" />
                      Freelancer's Deliverables
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {deliverables.length > 0 ? (
                      <div className="grid sm:grid-cols-2 gap-4">
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
                        <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-gray-500 text-sm">No deliverables submitted yet.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Original Document Manager */}
                <div className="pt-6 border-t border-gray-100">
                  <h3 className="text-md font-bold mb-4">Stage Documents</h3>
                  <DocumentManager
                    documents={documents}
                    stages={stages}
                    onUploadDocument={() => { }} // Client doesn't upload here
                    onViewDocument={() => { }}
                    onDownloadDocument={() => { }}
                  />
                </div>
              </TabsContent>

              <TabsContent value="communication" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="font-medium mb-2">Chat with Freelancer</h3>
                      <p className="text-gray-600 mb-4">
                        Start a conversation with the freelancer to discuss project details, provide feedback, or ask questions.
                      </p>
                      <Button onClick={handleChatWithFreelancer}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Start Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Financial Info */}
          <div className="space-y-6">
            {/* Show Financial Information unless it's already Paid/Released */}
            {!(getStatusString(project.status) === 'Paid' ||
              getStatusString(project.status) === 'PAID' ||
              getStatusString(project.payment_status) === 'Paid' ||
              getStatusString(project.payment_status) === 'Released' ||
              project.isPaid === true) && (
                <FinancialInformation
                  project={project}
                  onViewTransaction={handleViewTransaction}
                  onReleaseFunds={handleReleaseFunds}
                  onRefundFunds={handleRefundFunds}
                  onMarkComplete={handleMarkAsComplete}
                  releasing={releasing}
                  refunding={refunding}
                  completing={completing}
                />
              )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Project Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statusHistory.length > 0 ? (
                    statusHistory.map((h, i) => (
                      <div key={i} className="relative pl-6 pb-4 last:pb-0">
                        {i !== statusHistory.length - 1 && (
                          <div className="absolute left-2 top-2 bottom-0 w-0.5 bg-gray-100"></div>
                        )}
                        <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-blue-500 shadow-sm"></div>
                        <div className="text-sm">
                          <p className="font-bold text-gray-900">{h.status}</p>
                          <p className="text-xs text-gray-500">{new Date(h.created_at).toLocaleString()}</p>
                          {h.notes && <p className="text-xs text-gray-600 mt-1 italic">"{h.notes}"</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-gray-500 italic">
                      No activity recorded yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Original Project Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Project Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Created</div>
                      <div className="text-xs text-gray-500">
                        {project.created_at_readable ?
                          new Date(project.created_at_readable).toLocaleDateString() :
                          formatBookingDateShort(project.created_at)
                        }
                      </div>
                    </div>
                  </div>
                  {getStatusString(project.status) !== 'Completed' && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">In Progress</div>
                        <div className="text-xs text-gray-500">
                          {project.deadline_readable ?
                            `Due: ${new Date(project.deadline_readable).toLocaleDateString()}` :
                            project.delivery_deadline ?
                              `Due: ${formatBookingDateShort(project.delivery_deadline)}` :
                              'No deadline set'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                  {getStatusString(project.status) === 'Completed' && (
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">Completed</div>
                        <div className="text-xs text-gray-500">
                          {project.work_completed_at ?
                            formatBookingDateShort(project.work_completed_at) :
                            project.updated_at ?
                              formatBookingDateShort(project.updated_at) :
                              'Completed'
                          }
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleChatWithFreelancer}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message Freelancer
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  View Documents
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Project Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={handleSubmitReview}
        freelancerName={project?.freelancer_name || project?.freelancer_email || 'the freelancer'}
        serviceTitle={project?.service_title || project?.package_title || 'this project'}
        submitting={submittingReview}
      />
    </div>
  );
}