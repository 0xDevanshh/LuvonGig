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
import { getJobMarketplaceActor, serializeBigInts } from '@/lib/job-marketplace-agent';
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

        const actor = await getJobMarketplaceActor();
        const jobResult = await actor.getJobById(jobId);

        if (jobResult && jobResult.length > 0) {
          const serializedJob = serializeBigInts(jobResult[0]);
          console.log(`🔍 [LOG] Raw job status from canister:`, serializedJob.status);
          console.log(`🔍 [LOG] Job isPaid flag:`, serializedJob.isPaid);

          // Normalize job to look like a booking for the UI
          projectData = {
            ...serializedJob,
            booking_id: `job_${serializedJob.id}`,
            service_id: serializedJob.id,
            service_title: serializedJob.title,
            freelancer_email: serializedJob.freelancerId,
            freelancer_id: serializedJob.freelancerId,
            total_amount_e8s: serializedJob.budgetAmount,
            base_amount_e8s: serializedJob.budgetAmount,
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

  // Get escrow ID from project - try multiple fields
  const getEscrowId = (): string | null => {
    if (!project) return null;

    console.log('🔍 Looking for escrow ID in project:', {
      payment_id: project.payment_id,
      transaction_id: project.transaction_id,
      escrow_account: project.escrow_account,
      service_id: project.service_id,
      package_service_id: project.package_details?.service_id
    });

    // Try escrow_account first (this is the actual escrow ID from booking response)
    if (project.escrow_account && typeof project.escrow_account === 'string') {
      // escrow_account is the escrow ID in format: serviceId:number
      if (project.escrow_account.includes(':')) {
        console.log('✅ Found escrow ID in escrow_account:', project.escrow_account);
        return project.escrow_account;
      }
    }

    // Try payment_id (might be escrow ID)
    if (project.payment_id && typeof project.payment_id === 'string') {
      if (project.payment_id.includes(':')) {
        console.log('✅ Found escrow ID in payment_id:', project.payment_id);
        return project.payment_id;
      }
    }

    // Try transaction_id
    if (project.transaction_id && typeof project.transaction_id === 'string' && project.transaction_id.includes(':')) {
      console.log('✅ Found escrow ID in transaction_id:', project.transaction_id);
      return project.transaction_id;
    }

    // Last resort: construct from service_id
    const serviceId = project.service_id || project.package_details?.service_id || (project.isJob ? project.id : null);
    if (serviceId) {
      // For jobs, we always try to find the escrow using serviceId:0, serviceId:1 etc.
      const constructedId = `${serviceId}:0`;
      console.log('⚠️ Constructed escrow ID:', constructedId);
      return constructedId;
    }

    console.error('❌ No escrow ID found in project data');
    return null;
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

  // Handle release funds - call escrow canister directly using Plug wallet
  const handleReleaseFunds = async () => {
    let escrowId = getEscrowId();
    if (!escrowId) {
      alert('Escrow ID not found. Cannot release funds. Please check if the escrow exists.');
      return;
    }

    if (!confirm('Are you sure you want to release funds to the freelancer? This action cannot be undone.')) {
      return;
    }

    // Check if Plug wallet is available
    if (typeof window === 'undefined' || !(window as any).ic?.plug) {
      alert('Plug wallet not found. Please install and connect Plug wallet to release funds.');
      return;
    }

    const plug = (window as any).ic.plug;

    // Check if wallet is connected
    try {
      const isConnected = await plug.isConnected();
      if (!isConnected) {
        const connected = await plug.requestConnect({
          whitelist: [process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID || ''],
          host: process.env.NEXT_PUBLIC_IC_HOST || 'https://ic0.app',
        });
        if (!connected) {
          alert('Please connect your Plug wallet to release funds.');
          return;
        }
      }
    } catch (error) {
      alert('Failed to connect Plug wallet. Please try again.');
      return;
    }

    setReleasing(true);
    let success = false;
    let lastError = 'Unknown error';
    let foundEscrowId = escrowId;

    try {
      // First, get the escrow actor using Plug wallet
      const { Actor, HttpAgent } = await import('@dfinity/agent');
      const { Principal } = await import('@dfinity/principal');

      // Import IDL factory directly - ensure we get the latest version
      const escrowDidModule = await import('@/lib/declarations/escrow/escrow.did.js');
      const escrowIdlFactory = escrowDidModule.idlFactory;

      // Verify IDL factory exists and has the release method
      if (!escrowIdlFactory) {
        throw new Error('Failed to load escrow IDL factory');
      }
      console.log('✅ Escrow IDL factory loaded:', typeof escrowIdlFactory);

      // Get agent from Plug (has user's identity)
      // Increased wait time to ensure agent is fully ready
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for agent to be ready
      let agent = plug.agent;
      if (!agent) {
        agent = plug.createAgent?.() || plug.getAgent?.();
      }

      if (!agent) {
        // Create agent manually with Plug's identity
        const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://ic0.app';
        agent = new HttpAgent({
          host: IC_HOST,
          identity: plug.sessionManager?.identity || plug.identity,
        });

        if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
          await agent.fetchRootKey();
        }
      }

      // Ensure agent is ready by verifying it has an identity
      if (!agent || !agent.getPrincipal) {
        throw new Error('Agent is not properly initialized. Please reconnect your Plug wallet.');
      }

      // Verify agent identity is available
      try {
        const principal = await agent.getPrincipal();
        console.log('✅ Agent ready with principal:', principal.toString());
      } catch (identityError) {
        console.warn('⚠️ Could not verify agent identity, but continuing:', identityError);
      }

      const canisterId = Principal.fromText(process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID || '');
      console.log('🔧 Creating actor with canister ID:', canisterId.toString());
      console.log('🔧 IDL factory type:', typeof escrowIdlFactory);

      // Verify IDL factory structure
      if (typeof escrowIdlFactory !== 'function') {
        throw new Error(`Invalid IDL factory: expected function, got ${typeof escrowIdlFactory}`);
      }

      // Create actor with explicit IDL factory
      const escrowActor = Actor.createActor(escrowIdlFactory, {
        agent,
        canisterId,
      });

      // Verify the actor has the release method
      if (!escrowActor || typeof escrowActor.release !== 'function') {
        const actorKeys = escrowActor ? Object.keys(escrowActor) : [];
        throw new Error(`Escrow actor does not have release method. Available methods: ${actorKeys.join(', ')}`);
      }
      console.log('✅ Escrow actor created, release method available:', typeof escrowActor.release);

      // First, test with a query function to verify canister is accessible and IDL matches
      try {
        console.log('🔍 Testing canister connection with get_treasury query...');
        const treasuryTest: any = await escrowActor.get_treasury();
        console.log('✅ Canister query successful, treasury:', treasuryTest.toString());
      } catch (testError: any) {
        console.error('❌ Canister query test failed:', testError);
        throw new Error(`Cannot connect to escrow canister. This might indicate the canister needs to be redeployed or there's a network issue. Error: ${testError.message}`);
      }

      // Try to find the escrow - try different counter values if needed
      console.log('🔍 Attempting to release escrow:', escrowId);

      let escrow: any = null;
      let escrowFound = false;

      try {
        escrow = await escrowActor.get(escrowId);
        escrowFound = true;
        foundEscrowId = escrowId;
        console.log('✅ Escrow found with ID:', escrowId);
      } catch (getError: any) {
        // Try different counter values
        if (escrowId.includes(':')) {
          const parts = escrowId.split(':');
          const projectId = parts.slice(0, -1).join(':');

          for (let i = 0; i <= 20; i++) {
            const tryEscrowId = `${projectId}:${i}`;
            try {
              escrow = await escrowActor.get(tryEscrowId);
              foundEscrowId = tryEscrowId;
              escrowFound = true;
              console.log(`✅ Found escrow with ID: ${tryEscrowId}`);
              break;
            } catch (e) {
              // Not found, continue
            }
          }
        }
      }

      if (!escrowFound || !escrow) {
        throw new Error(`Escrow not found: ${escrowId}`);
      }

      // IMPORTANT: Refresh funding status first to update from #created to #funded
      // This checks the ledger balance and updates status if funds are available
      console.log('🔄 Refreshing escrow funding status...');
      const refreshResult: any = await escrowActor.refresh_funding(foundEscrowId);
      const balance = Number(refreshResult.balanceE8s);
      const isFunded = refreshResult.funded;
      const expectedE8s = Number(escrow.expectedE8s || 0);

      console.log('📊 Refresh result:', {
        funded: isFunded,
        balanceE8s: balance,
        balanceICP: balance / 100000000,
        expectedE8s: expectedE8s,
        expectedICP: expectedE8s / 100000000
      });

      if (!isFunded && !(escrow.status && 'released' in escrow.status)) {
        if (balance === 0) {
          throw new Error(`No funds found in escrow. Balance: 0 ICP. Please deposit funds to the escrow account first.`);
        } else {
          throw new Error(`Escrow is not fully funded. Current balance: ${balance / 100000000} ICP, Expected: ${expectedE8s / 100000000} ICP`);
        }
      }

      // Check if ALREADY released - if so, we just want to ensure frontend/job canister sync
      if (escrow.status && 'released' in escrow.status) {
        console.log('ℹ️ Escrow is already released. Proceeding to sync status...');
        await markAsCompletedAndPaidAfterRelease();
        setReleasing(false);
        return;
      }

      // Get updated escrow to verify status
      escrow = await escrowActor.get(foundEscrowId);
      console.log('✅ Escrow status updated. Current status:',
        escrow.status && 'funded' in escrow.status ? 'FUNDED' :
          escrow.status && 'created' in escrow.status ? 'CREATED' : 'OTHER');

      // Get service price (base amount) from project data
      let servicePriceE8s: bigint;
      if (project?.base_amount_e8s) {
        servicePriceE8s = BigInt(project.base_amount_e8s);
        console.log('✅ Using service price from project data:', Number(servicePriceE8s) / 100000000, 'ICP');
      } else {
        // Calculate from expected amount: servicePrice = (expectedE8s - networkFee) / (1 + platformFee)
        const NETWORK_TRANSFER_FEE_E8S = BigInt(30000); // 0.0003 ICP
        const expectedE8s = BigInt((escrow as any).expectedE8s || 0);

        // Use the plan from the escrow record if available
        const isPremium = escrow.plan && 'premium' in escrow.plan;
        const feeMultiplier = isPremium ? BigInt(103) : BigInt(104);

        if (expectedE8s > NETWORK_TRANSFER_FEE_E8S) {
          const amountAfterNetworkFee = expectedE8s - NETWORK_TRANSFER_FEE_E8S;
          servicePriceE8s = (amountAfterNetworkFee * BigInt(100)) / feeMultiplier;
          console.log('📊 Calculated service price from expected amount:', Number(servicePriceE8s) / 100000000, 'ICP');
        } else {
          throw new Error('Invalid escrow amount: cannot calculate service price');
        }
      }

      // Call release directly with Plug wallet (authenticated call)
      // Update calls can take 30-90 seconds, so we add a timeout wrapper
      console.log('🚀 Releasing escrow with Plug wallet:', foundEscrowId, 'with service price:', Number(servicePriceE8s) / 100000000, 'ICP');
      console.log('🔍 Escrow actor type:', typeof escrowActor);
      console.log('🔍 Release function type:', typeof escrowActor.release);

      let releaseResult: any;
      try {
        // Add timeout wrapper for the release call (update calls can take 30-90 seconds)
        const releasePromise = escrowActor.release(foundEscrowId, servicePriceE8s);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Release call timed out after 120 seconds. The canister may be processing the request. Please check the escrow status and try again if needed.')), 120000)
        );

        releaseResult = await Promise.race([releasePromise, timeoutPromise]);
        console.log('✅ Release result received:', releaseResult);
        console.log('✅ Release result type:', typeof releaseResult);
        console.log('✅ Release result keys:', Object.keys(releaseResult || {}));
      } catch (callError: any) {
        console.error('❌ Error calling release:', callError);
        console.error('❌ Error details:', {
          message: callError.message,
          stack: callError.stack,
          name: callError.name,
          cause: callError.cause
        });

        // Check for timeout or read state errors
        if (callError.message?.includes('Invalid read state') ||
          callError.message?.includes('response could not be found') ||
          callError.message?.includes('timed out')) {
          const errorMsg = `The release call timed out or the response was not found. This can happen if:\n\n` +
            `1. The network is slow or unstable\n` +
            `2. The canister is processing other requests\n` +
            `3. The agent connection was interrupted\n\n` +
            `Please try again. If the issue persists, check:\n` +
            `- Your internet connection\n` +
            `- The escrow canister status\n` +
            `- Try refreshing the page and reconnecting your wallet\n\n` +
            `Escrow ID: ${foundEscrowId}\n` +
            `Original error: ${callError.message}`;
          throw new Error(errorMsg);
        }

        // Check if it's an IDL parsing error
        if (callError.message?.includes('IDL error') || callError.message?.includes('parsing') || callError.message?.includes('unexpected IDL type')) {
          const errorMsg = `IDL Mismatch Error: The deployed escrow canister (${process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID}) has a different interface than expected.\n\n` +
            `Expected: release(escrowId, servicePriceE8s) returns TransferResult { ok: Nat } | { err: Text }\n` +
            `Actual: The deployed canister appears to return a different type.\n\n` +
            `Solution: Rebuild and redeploy the escrow canister with:\n` +
            `  cd backend && dfx deploy escrow --network ic\n\n` +
            `Original error: ${callError.message}`;
          throw new Error(errorMsg);
        }
        throw callError;
      }

      // Handle the result - check for both possible formats
      if (!releaseResult) {
        throw new Error('Release function returned undefined or null');
      }

      if (typeof releaseResult === 'object') {
        if ('err' in releaseResult) {
          throw new Error(String(releaseResult.err));
        }
        if ('ok' in releaseResult) {
          console.log('✅ Release successful, block index:', releaseResult.ok);
        } else {
          console.warn('⚠️ Unexpected result format:', releaseResult);
          // Try to proceed anyway if it seems like a success
          if (typeof releaseResult === 'bigint' || typeof releaseResult === 'number') {
            console.log('✅ Assuming success - got block index:', releaseResult);
          } else {
            throw new Error(`Unexpected release result format: ${JSON.stringify(releaseResult)}`);
          }
        }
      } else {
        throw new Error(`Release function returned unexpected type: ${typeof releaseResult}, value: ${releaseResult}`);
      }

      // Mark project as completed and update payment status
      await markAsCompletedAndPaidAfterRelease();

      success = true;

      // Show success message and review modal
      console.log('✅ Funds released successfully! Project marked as completed.');
      setShowReviewModal(true);
    } catch (error: any) {
      console.error('❌ Error releasing escrow:', error);
      lastError = error.message || 'Unknown error';

      // Handle specific errors
      if (error.message?.includes('Unauthorized') || error.message?.includes('unauthorized')) {
        alert(`Failed to release funds: ${lastError}\n\nMake sure you are using the correct wallet that created the escrow.\nEscrow ID: ${foundEscrowId}`);
      } else {
        alert(`Failed to release funds: ${lastError}\n\nEscrow ID used: ${foundEscrowId}\n\nPlease check the escrow ID or contact support.`);
      }
    } finally {
      setReleasing(false);
    }
  };

  // Handle refund funds - call escrow canister directly using Plug wallet
  const handleRefundFunds = async () => {
    let escrowId = getEscrowId();
    if (!escrowId) {
      alert('Escrow ID not found. Cannot refund funds. Please check if the escrow exists.');
      return;
    }

    if (!confirm('Are you sure you want to refund the funds? This will return the money to your wallet.')) {
      return;
    }

    // Check if Plug wallet is available
    if (typeof window === 'undefined' || !(window as any).ic?.plug) {
      alert('Plug wallet not found. Please install and connect Plug wallet to refund funds.');
      return;
    }

    const plug = (window as any).ic.plug;

    // Check if wallet is connected
    try {
      const isConnected = await plug.isConnected();
      if (!isConnected) {
        const connected = await plug.requestConnect({
          whitelist: [process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID || ''],
          host: process.env.NEXT_PUBLIC_IC_HOST || 'https://ic0.app',
        });
        if (!connected) {
          alert('Please connect your Plug wallet to refund funds.');
          return;
        }
      }
    } catch (error) {
      alert('Failed to connect Plug wallet. Please try again.');
      return;
    }

    setRefunding(true);
    let success = false;
    let lastError = 'Unknown error';
    let foundEscrowId = escrowId;

    try {
      // Get the escrow actor using Plug wallet
      const { Actor, HttpAgent } = await import('@dfinity/agent');
      const { Principal } = await import('@dfinity/principal');
      const { idlFactory: escrowIdlFactory } = await import('@/lib/declarations/escrow/escrow.did.js');

      // Get agent from Plug (has user's identity)
      // Increased wait time to ensure agent is fully ready
      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for agent to be ready
      let agent = plug.agent;
      if (!agent) {
        agent = plug.createAgent?.() || plug.getAgent?.();
      }

      if (!agent) {
        // Create agent manually with Plug's identity
        const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://ic0.app';
        agent = new HttpAgent({
          host: IC_HOST,
          identity: plug.sessionManager?.identity || plug.identity,
        });

        if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
          await agent.fetchRootKey();
        }
      }

      // Ensure agent is ready by verifying it has an identity
      if (!agent || !agent.getPrincipal) {
        throw new Error('Agent is not properly initialized. Please reconnect your Plug wallet.');
      }

      // Verify agent identity is available
      try {
        const principal = await agent.getPrincipal();
        console.log('✅ Agent ready with principal:', principal.toString());
      } catch (identityError) {
        console.warn('⚠️ Could not verify agent identity, but continuing:', identityError);
      }

      const canisterId = Principal.fromText(process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID || '');
      const escrowActor = Actor.createActor(escrowIdlFactory, {
        agent,
        canisterId,
      });

      // Try to find the escrow - try different counter values if needed
      console.log('🔍 Attempting to refund escrow:', escrowId);

      let escrow: any = null;
      let escrowFound = false;

      try {
        escrow = await escrowActor.get(escrowId);
        escrowFound = true;
        foundEscrowId = escrowId;
        console.log('✅ Escrow found with ID:', escrowId);
      } catch (getError: any) {
        // Try different counter values
        if (escrowId.includes(':')) {
          const parts = escrowId.split(':');
          const projectId = parts.slice(0, -1).join(':');

          for (let i = 0; i <= 20; i++) {
            const tryEscrowId = `${projectId}:${i}`;
            try {
              escrow = await escrowActor.get(tryEscrowId);
              foundEscrowId = tryEscrowId;
              escrowFound = true;
              console.log(`✅ Found escrow with ID: ${tryEscrowId}`);
              break;
            } catch (e) {
              // Not found, continue
            }
          }
        }
      }

      if (!escrowFound || !escrow) {
        throw new Error(`Escrow not found: ${escrowId}`);
      }

      // Check escrow status - cannot refund if already released
      if (escrow.status && 'released' in escrow.status) {
        throw new Error('Cannot refund a released escrow');
      }

      // Refresh funding to get current balance
      console.log('🔄 Refreshing escrow funding status before refund...');
      const refreshResult: any = await escrowActor.refresh_funding(foundEscrowId);
      const balance = Number(refreshResult.balanceE8s);

      console.log('📊 Refresh result:', {
        funded: refreshResult.funded,
        balanceE8s: balance,
        balanceICP: balance / 100000000
      });

      if (balance === 0) {
        throw new Error('No funds available to refund. Balance: 0 ICP');
      }

      // Call refund directly with Plug wallet (authenticated call)
      // Update calls can take 30-90 seconds, so we add a timeout wrapper
      console.log('🔄 Refunding escrow with Plug wallet:', foundEscrowId);

      let refundResult: any;
      try {
        // Add timeout wrapper for the refund call (update calls can take 30-90 seconds)
        const refundPromise = escrowActor.refund(foundEscrowId);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Refund call timed out after 120 seconds. The canister may be processing the request. Please check the escrow status and try again if needed.')), 120000)
        );

        refundResult = await Promise.race([refundPromise, timeoutPromise]);
      } catch (callError: any) {
        console.error('❌ Error calling refund:', callError);
        console.error('❌ Error details:', {
          message: callError.message,
          stack: callError.stack,
          name: callError.name,
          cause: callError.cause
        });

        // Check for timeout or read state errors
        if (callError.message?.includes('Invalid read state') ||
          callError.message?.includes('response could not be found') ||
          callError.message?.includes('timed out')) {
          const errorMsg = `The refund call timed out or the response was not found. This can happen if:\n\n` +
            `1. The network is slow or unstable\n` +
            `2. The canister is processing other requests\n` +
            `3. The agent connection was interrupted\n\n` +
            `Please try again. If the issue persists, check:\n` +
            `- Your internet connection\n` +
            `- The escrow canister status\n` +
            `- Try refreshing the page and reconnecting your wallet\n\n` +
            `Escrow ID: ${foundEscrowId}\n` +
            `Original error: ${callError.message}`;
          throw new Error(errorMsg);
        }

        // Check if it's an IDL parsing error
        if (callError.message?.includes('IDL error') || callError.message?.includes('parsing') || callError.message?.includes('unexpected IDL type')) {
          const errorMsg = `IDL Mismatch Error: The deployed escrow canister (${process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID}) has a different interface than expected.\n\n` +
            `Expected: refund(escrowId) returns TransferResult { ok: Nat } | { err: Text }\n` +
            `Actual: The deployed canister appears to return a different type.\n\n` +
            `Solution: Rebuild and redeploy the escrow canister with:\n` +
            `  cd backend && dfx deploy escrow --network ic\n\n` +
            `Original error: ${callError.message}`;
          throw new Error(errorMsg);
        }
        throw callError;
      }

      if (!refundResult) {
        throw new Error('Refund function returned undefined or null');
      }

      if ('err' in refundResult) {
        throw new Error(String(refundResult.err));
      }

      success = true;
      alert(`Funds refunded successfully! Block index: ${refundResult.ok}`);
      fetchProjectDetails();
    } catch (error: any) {
      console.error('❌ Error refunding escrow:', error);
      lastError = error.message || 'Unknown error';

      // Handle specific errors
      if (error.message?.includes('Unauthorized') || error.message?.includes('unauthorized')) {
        alert(`Failed to refund funds: ${lastError}\n\nMake sure you are using the correct wallet that created the escrow.\nEscrow ID: ${foundEscrowId}`);
      } else {
        alert(`Failed to refund funds: ${lastError}\n\nEscrow ID used: ${foundEscrowId}\n\nPlease check the escrow ID or contact support.`);
      }
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