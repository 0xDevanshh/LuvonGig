'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useBookings, useJobProjects } from '@/hooks/useMarketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatICP } from '@/lib/ic-marketplace-agent';
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

export default function ClientProjects() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string>(''); // For service bookings (email)
  const [jobUserId, setJobUserId] = useState<string>(''); // For job marketplace (8-char ID)
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [escrowStatuses, setEscrowStatuses] = useState<Record<string, { funded: boolean; balanceE8s: number; status: string }>>({});
  const [escrowIds, setEscrowIds] = useState<Record<string, string>>({}); // Map booking_id to escrowId
  const [processingEscrow, setProcessingEscrow] = useState<Record<string, 'releasing' | 'refunding'>>({});

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
      amount: Number(b.total_amount_e8s) / 100000000,
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
        amount: Number(j.budgetAmount) / 100000000,
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


  // Get escrow ID from booking - try multiple formats since escrow ID is projectId:number
  // Also try to find escrows even if there's no booking (for escrows created before booking creation was added)
  const getEscrowId = async (booking: any, userPrincipal?: string): Promise<string | null> => {
    const projectId = booking.service_id || booking.booking_id;
    if (!projectId) {

      return null;
    }



    // Try to find the escrow by checking multiple possible IDs (0, 1, 2, etc.)
    // Escrow IDs are in format projectId:number where number auto-increments
    for (let i = 0; i < 20; i++) { // Increased to 20 to find more escrows
      const escrowId = `${projectId}:${i}`;
      try {

        const response = await fetch(`/api/escrow/${escrowId}/refresh`);
        const result = await response.json();
        if (result.success) {
          // Found a valid escrow - verify it belongs to this user if we have principal
          if (userPrincipal) {
            try {
              // Get escrow details to verify client
              const escrowResponse = await fetch(`/api/escrow/${escrowId}/get`);
              if (escrowResponse.ok) {
                const escrowData = await escrowResponse.json();
                if (escrowData.success && escrowData.data.client === userPrincipal) {

                  return escrowId;
                } else {

                  continue;
                }
              }
            } catch (e) {
              // If we can't verify, still use it (might be the user's escrow)

            }
          }
          // Found a valid escrow

          return escrowId;
        } else {

        }
      } catch (error: any) {

        // Continue to next number
        continue;
      }
    }

    return null;
  };

  // Fetch escrow status for a booking
  const fetchEscrowStatus = async (escrowId: string) => {
    try {
      const response = await fetch(`/api/escrow/${escrowId}/refresh`);
      const result = await response.json();
      if (result.success) {
        setEscrowStatuses(prev => ({
          ...prev,
          [escrowId]: {
            funded: result.data.funded,
            balanceE8s: result.data.balanceE8s,
            status: result.data.funded ? 'funded' : 'created'
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching escrow status:', error);
    }
  };

  // Release escrow funds using Plug wallet
  const handleReleaseEscrow = async (e: React.MouseEvent, escrowId: string) => {
    e.stopPropagation(); // Prevent card click

    if (!confirm('Are you sure you want to release the escrow? Funds will be transferred to the freelancer.')) {
      return;
    }

    setProcessingEscrow(prev => ({ ...prev, [escrowId]: 'releasing' }));

    try {
      // Check if Plug wallet is available
      if (typeof window === 'undefined' || !(window as any).ic?.plug) {
        throw new Error('Plug wallet not found. Please install Plug wallet extension.');
      }

      const plug = (window as any).ic.plug;
      const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';
      const escrowCanisterId = process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID;

      if (!escrowCanisterId) {
        throw new Error('Escrow canister ID not configured');
      }

      // Ensure wallet is connected
      const isConnected = await plug.isConnected();
      if (!isConnected) {
        const connected = await plug.requestConnect({
          whitelist: [escrowCanisterId],
          host: IC_HOST,
        });
        if (!connected) {
          throw new Error('Wallet connection was cancelled or failed');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get agent from Plug
      let agent = plug.agent || plug.createAgent?.() || plug.getAgent?.();
      if (!agent) {
        await new Promise(resolve => setTimeout(resolve, 500));
        agent = plug.agent;
      }

      if (!agent) {
        throw new Error('Failed to get wallet agent');
      }

      // Fetch root key for localhost
      if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
        try {
          await agent.fetchRootKey();
        } catch (e) {
          // Ignore
        }
      }

      // Create escrow actor with Plug's agent
      const { Actor } = await import('@dfinity/agent');
      const { Principal } = await import('@dfinity/principal');
      const { idlFactory: escrowIdlFactory } = await import('@/lib/declarations/escrow/escrow.did.js');

      const canisterId = Principal.fromText(escrowCanisterId);
      const escrowActor = Actor.createActor(escrowIdlFactory, {
        agent,
        canisterId,
      });

      // Get service price - try to get from booking data
      // First, try to get booking by escrow projectId
      let servicePriceE8s: bigint;
      try {
        // Get escrow to find projectId
        const escrowData: any = await escrowActor.get(escrowId);
        const projectId = escrowData.projectId;

        // Try to fetch booking data
        const bookingResponse = await fetch(`/api/marketplace/bookings/${projectId}`);
        const bookingData = await bookingResponse.json();

        if (bookingData.success && bookingData.data?.base_amount_e8s) {
          servicePriceE8s = BigInt(bookingData.data.base_amount_e8s);

        } else {
          // Calculate from expected amount
          const NETWORK_TRANSFER_FEE_E8S = BigInt(40000);
          const expectedE8s = BigInt(escrowData.expectedE8s || 0);
          if (expectedE8s > NETWORK_TRANSFER_FEE_E8S) {
            const amountAfterNetworkFee = expectedE8s - NETWORK_TRANSFER_FEE_E8S;
            servicePriceE8s = (amountAfterNetworkFee * BigInt(100)) / BigInt(105);

          } else {
            throw new Error('Invalid escrow amount');
          }
        }
      } catch (error: any) {
        console.warn('⚠️ Could not get service price, calculating from escrow:', error.message);
        // Fallback: get escrow and calculate
        const escrowData: any = await escrowActor.get(escrowId);
        const NETWORK_TRANSFER_FEE_E8S = BigInt(40000);
        const expectedE8s = BigInt(escrowData.expectedE8s || 0);
        if (expectedE8s > NETWORK_TRANSFER_FEE_E8S) {
          const amountAfterNetworkFee = expectedE8s - NETWORK_TRANSFER_FEE_E8S;
          servicePriceE8s = (amountAfterNetworkFee * BigInt(100)) / BigInt(105);
        } else {
          throw new Error('Invalid escrow amount: cannot calculate service price');
        }
      }

      // Call release function directly with service price
      const result: any = await escrowActor.release(escrowId, servicePriceE8s);

      if ('err' in result) {
        throw new Error(result.err);
      }

      // Success - refresh status and bookings
      await fetchEscrowStatus(escrowId);
      await fetchBookings();
      alert('Escrow released successfully! Funds have been transferred to the freelancer.');

    } catch (error: any) {
      console.error('Error releasing escrow:', error);
      alert(`Failed to release escrow: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingEscrow(prev => {
        const newState = { ...prev };
        delete newState[escrowId];
        return newState;
      });
    }
  };

  // Refund escrow funds using Plug wallet
  const handleRefundEscrow = async (e: React.MouseEvent, escrowId: string) => {
    e.stopPropagation(); // Prevent card click
    if (!confirm('Are you sure you want to refund this escrow? Funds will be returned to your wallet.')) {
      return;
    }

    setProcessingEscrow(prev => ({ ...prev, [escrowId]: 'refunding' }));

    try {
      // Check if Plug wallet is available
      if (typeof window === 'undefined' || !(window as any).ic?.plug) {
        throw new Error('Plug wallet not found. Please install Plug wallet extension.');
      }

      const plug = (window as any).ic.plug;
      const IC_HOST = process.env.NEXT_PUBLIC_IC_HOST || 'https://icp0.io';
      const escrowCanisterId = process.env.NEXT_PUBLIC_ESCROW_CANISTER_ID;

      if (!escrowCanisterId) {
        throw new Error('Escrow canister ID not configured');
      }

      // Ensure wallet is connected
      const isConnected = await plug.isConnected();
      if (!isConnected) {
        const connected = await plug.requestConnect({
          whitelist: [escrowCanisterId],
          host: IC_HOST,
        });
        if (!connected) {
          throw new Error('Wallet connection was cancelled or failed');
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      // Get agent from Plug
      let agent = plug.agent || plug.createAgent?.() || plug.getAgent?.();
      if (!agent) {
        await new Promise(resolve => setTimeout(resolve, 500));
        agent = plug.agent;
      }

      if (!agent) {
        throw new Error('Failed to get wallet agent');
      }

      // Fetch root key for localhost
      if (IC_HOST.includes('localhost') || IC_HOST.includes('127.0.0.1')) {
        try {
          await agent.fetchRootKey();
        } catch (e) {
          // Ignore
        }
      }

      // Create escrow actor with Plug's agent
      const { Actor } = await import('@dfinity/agent');
      const { Principal } = await import('@dfinity/principal');
      const { idlFactory: escrowIdlFactory } = await import('@/lib/declarations/escrow/escrow.did.js');

      const canisterId = Principal.fromText(escrowCanisterId);
      const escrowActor = Actor.createActor(escrowIdlFactory, {
        agent,
        canisterId,
      });

      // Call refund function directly
      const result: any = await escrowActor.refund(escrowId);

      if ('err' in result) {
        throw new Error(result.err);
      }

      // Success - refresh status and bookings
      await fetchEscrowStatus(escrowId);
      await fetchBookings();
      alert('Escrow refunded successfully! Funds have been returned to your wallet.');

    } catch (error: any) {
      console.error('Error refunding escrow:', error);
      alert(`Failed to refund escrow: ${error.message || 'Unknown error'}`);
    } finally {
      setProcessingEscrow(prev => {
        const newState = { ...prev };
        delete newState[escrowId];
        return newState;
      });
    }
  };

  // Fetch escrow statuses for all bookings with escrow payments
  useEffect(() => {
    const fetchEscrows = async () => {
      if (bookings.length > 0) {

        for (const booking of bookings) {
          // Only fetch if payment status indicates escrow
          const isEscrowPayment = getStatusString(booking.payment_status) === 'HeldInEscrow' || booking.payment_method === 'escrow';
          if (isEscrowPayment) {

            const escrowId = await getEscrowId(booking);
            if (escrowId) {

              // Store the escrow ID for this booking
              setEscrowIds(prev => ({
                ...prev,
                [booking.booking_id]: escrowId
              }));
              // Fetch status if not already fetched
              if (!escrowStatuses[escrowId]) {
                await fetchEscrowStatus(escrowId);
              }
            } else {

            }
          }
        }
      }
    };
    fetchEscrows();
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
                Newly created escrow payments will appear here once they are funded.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Projects Grid */}
          {allProjects.length > 0 ? (
            allProjects
              .filter((project) => {
                // Apply status filter if set
                if (statusFilter && project.displayStatus !== statusFilter) {
                  return false;
                }

                // Show all non-escrow projects
                const isEscrowPayment = project.payment_method === 'escrow' || getStatusString(project.payment_status) === 'HeldInEscrow';
                if (!isEscrowPayment) {
                  return true;
                }

                // For escrow projects:
                const escrowId = escrowIds[project.id];

                // If escrow ID not found yet, still show it (escrow lookup might be in progress)
                if (!escrowId) {
                  return true;
                }

                // If escrow ID found, check if it's funded
                const escrowStatus = escrowStatuses[escrowId];
                if (!escrowStatus) {
                  return true; // Still loading status, show it
                }

                // Only show if funded
                return escrowStatus.funded;
              })
              .map((project) => {
                // Get the escrow ID for this project
                const escrowId = escrowIds[project.id];
                const escrowStatus = escrowId ? escrowStatuses[escrowId] : null;
                const isEscrowPayment = project.payment_method === 'escrow' || getStatusString(project.payment_status) === 'HeldInEscrow';
                const isProcessing = escrowId && processingEscrow[escrowId];

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
                            {project.amount.toFixed(4) + ' ICP'}
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

                        {/* Escrow Actions - Only show for funded escrows */}
                        {isEscrowPayment && escrowId && escrowStatus && escrowStatus.funded && project.displayStatus !== 'Completed' && project.displayStatus !== 'CompletedAndPaid' && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                              <Wallet size={14} className="text-purple-600" />
                              <span className="text-xs font-medium text-gray-700">Escrow Payment</span>
                              <Badge variant="default" className="text-xs bg-green-600">
                                ✓ Funded
                              </Badge>
                            </div>
                            <div className="space-y-2">
                              <button
                                onClick={(e) => handleReleaseEscrow(e, escrowId)}
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
                                onClick={(e) => handleRefundEscrow(e, escrowId)}
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
