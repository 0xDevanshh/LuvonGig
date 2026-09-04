'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useUserContext } from '@/contexts/UserContext';
import {
    ChevronLeft,
    Shield,
    Info,
    Sparkles,
    Briefcase
} from 'lucide-react';
import { OrderSummary } from '@/components/payment/OrderSummary';
import { PaymentProcessing } from '@/components/payment/PaymentProcessing';
import { PaymentSuccess } from '@/components/payment/PaymentSuccess';
import StripeCheckout from '@/components/payment/StripeCheckout';
import { getJob } from '@/lib/api/jobs';
import { getUserProfileByEmail } from '@/lib/user-profile';

export default function ProposalCheckoutPage() {
    const router = useRouter();
    const { proposalId } = useParams<{ proposalId: string }>();
    const [jobId, setJobId] = useState<string | null>(null);
    const { profile } = useUserContext();

    const [job, setJob] = useState<any>(null);
    const [proposal, setProposal] = useState<any>(null);

    const [loading, setLoading] = useState(true);
    const [paymentStep, setPaymentStep] = useState<'details' | 'processing' | 'success'>('details');
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [paymentResult, setPaymentResult] = useState<any>(null);

    const [freelancerFee, setFreelancerFee] = useState<number>(0.04); // Default 4%

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            setJobId(urlParams.get('jobId'));
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            if (!proposalId || !jobId) {
                console.log('❌ Missing proposalId or jobId:', { proposalId, jobId });
                return;
            }

            try {
                console.log('🔍 Fetching data for checkout:', { proposalId, jobId, userEmail: profile.email });
                // One request carries the job and the proposals this caller
                // may see; the API decides which those are.
                const serializedJob = await getJob(jobId);
                setJob(serializedJob);

                {
                    const matchingProposal = (serializedJob.proposals ?? [])
                        .find((p) => p.id === proposalId);
                    if (matchingProposal) {
                        const serializedProposal = matchingProposal;
                        setProposal(serializedProposal);

                        // Fetch Freelancer's Plan Fee
                        try {
                            const freelancerEmail = serializedProposal.freelancerId;
                            const subResponse = await fetch(`/api/subscription?email=${encodeURIComponent(freelancerEmail)}`);
                            const subResult = await subResponse.json();
                            if (subResult.success && subResult.data) {
                                setFreelancerFee(subResult.data.marketplace_fee);
                                console.log('✅ Freelancer fee found:', subResult.data.marketplace_fee);
                            }
                        } catch (feeError) {
                            console.warn('⚠️ Could not fetch freelancer fee:', feeError);
                        }

                    } else {
                        console.error('Proposal not found on this job:', proposalId);
                    }
                }
            } catch (error) {
                console.error('❌ Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (jobId && profile.email) {
            fetchData();
        }
    }, [proposalId, jobId, profile.email]);

    const calculateSubtotal = (): number => {
        if (!proposal) return 0;
        // Minor units now, not e8s.
        return Number(proposal.bid_minor) / 100;
    };

    const calculatePlatformFee = (): number => {
        return calculateSubtotal() * freelancerFee;
    };

    const calculateTotal = (): number => {
        return calculateSubtotal() + calculatePlatformFee();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!job || !proposal) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Job or Proposal Not Found</h2>
                    <p className="text-gray-600 mb-4">The proposal you're trying to accept doesn't exist or you don't have access.</p>
                    <Link href="/client/my-job-posts" className="text-purple-600 hover:text-purple-700 font-medium">
                        Back to Job Posts
                    </Link>
                </div>
            </div>
        );
    }

    if (paymentStep === 'processing') {
        return <PaymentProcessing />;
    }

    if (paymentStep === 'success') {
        const currentTime = Date.now();
        const bookingData = {
            createdAt: currentTime,
            deliveryDeadline: currentTime + (Number(proposal.estimatedDeliveryDays) * 24 * 60 * 60 * 1000),
            deliveryDays: Number(proposal.estimatedDeliveryDays),
            paymentCompletedAt: currentTime,
            bookingConfirmedAt: currentTime,
            transactionId: paymentResult?.transactionId,
            tokenSymbol: 'USD',
            tokenAmount: calculateTotal().toString(),
        };

        return (
            <PaymentSuccess
                bookingData={bookingData}
                serviceTitle={job.title}
                freelancerEmail={proposal.freelancerId}
            />
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ChevronLeft size={20} />
                    <span className="ml-1">Back to Applications</span>
                </button>

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Accept Job Proposal</h1>
                    <p className="text-gray-600">Secure your project funds and start working with {proposal.freelancerId}</p>
                </div>

                {/* Error Message */}
                {bookingError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Info className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h4 className="font-medium text-red-900">Payment Error</h4>
                                <p className="text-sm text-red-700 mt-1">{bookingError}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Details */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Job Summary */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4">
                                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                    <Sparkles size={12} />
                                    Top Proposal
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                                    <Briefcase size={32} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">{job.title}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-2 mb-3">{job.description}</p>

                                    <div className="flex flex-wrap gap-4 text-sm">
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <span className="font-semibold text-gray-900">${(Number(proposal.bid_minor) / 100).toFixed(2)}</span>
                                            <span>Bid Amount</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-gray-500">
                                            <span className="font-semibold text-gray-900">{proposal.estimatedDeliveryDays} Days</span>
                                            <span>Estimated Delivery</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Freelancer Info */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Freelancer Details</h3>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 border-2 border-white shadow-sm">
                                    {proposal.freelancerId.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{proposal.freelancerId}</h4>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <span className="text-yellow-500">★★★★★</span>
                                        <span>Highly recommended freelancer</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cover Letter */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-2">Proposal Message</h3>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed italic">
                                "{proposal.coverLetter}"
                            </p>
                        </div>

                        {/* Escrow Payment via Plug */}
                        <div className="bg-white rounded-xl border-2 border-dashed border-purple-200 p-6 bg-gradient-to-br from-white to-purple-50">
                            <div className="mb-4">
                                <h3 className="font-bold text-lg text-gray-900 mb-2">Escrow Payment (Plug Wallet)</h3>
                                <p className="text-sm text-gray-600">
                                    Your funds will be held securely in a blockchain escrow.
                                    Payment is only released to the freelancer once you approve the delivered work.
                                </p>
                            </div>

                            <StripeCheckout
                                proposalId={proposal.id}
                                onSuccess={(paymentId) => {
                                    setPaymentResult({ transactionId: paymentId });
                                    setPaymentStep('success');
                                }}
                            />
                        </div>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-4">
                            <OrderSummary
                                packagePrice={calculateSubtotal()}
                                upsells={[]}
                                promoApplied={null}
                                total={calculateTotal()}
                                platformFee={calculatePlatformFee()}
                                platformFeeRate={freelancerFee}
                                                subtotal={calculateSubtotal()}
                            />

                            {/* Trust Badges */}
                            <div className="p-4 bg-white/60 backdrop-blur-sm border border-purple-100 rounded-xl shadow-sm">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Shield className="text-purple-600" size={20} />
                                    <span className="font-bold text-gray-900">Workbud Guarantee</span>
                                </div>
                                <p className="text-xs text-gray-600">
                                    Your payment is protected. Freelancers are only paid for work you approve.
                                    If expectations aren't met, our dispute resolution team is here to help.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
