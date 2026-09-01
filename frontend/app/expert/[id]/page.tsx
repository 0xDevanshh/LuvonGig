"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserContext } from '@/contexts/UserContext';
import {
    Award,
    DollarSign,
    Calendar,
    ArrowLeft,
    CheckCircle2,
    ShieldCheck,
    MessageSquare,
    User,
    Info,
    Star
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import StripeCheckout from '@/components/payment/StripeCheckout';

export default function ExpertDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile } = useUserContext();
    const [loading, setLoading] = useState(true);
    const [expert, setExpert] = useState<any>(null);
    const [isPayOpen, setIsPayOpen] = useState(false);

    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchExpert = async () => {
            try {
                const response = await fetch('/api/expert/list');
                const data = await response.json();
                if (data.success) {
                    const found = data.experts.find((e: any) => e.id.toString() === id);
                    if (found) {
                        setExpert(found);
                    } else {
                        toast.error('Expert not found');
                        router.push('/experts');
                    }
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExpert();
    }, [id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!expert) return null;

    const handlePaymentSuccess = async (result: any) => {
        console.log('Payment success callback from widget:', result);
        toast.success('Payment Successful! Confirming your booking...');

        // Robust ID extraction
        const paymentId = result.paymentId || result.id || 'sandbox_success';
        const transactionId = result.transactionId || result.hash || 'sandbox_tx';

        try {
            const response = await fetch('/api/expert/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expert_id: expert.id,
                    payment_id: paymentId,
                    transaction_id: transactionId,
                    amount_icp: expert.session_amount_icp
                })
            });

            const data = await response.json();
            console.log('Booking response:', data);
            if (data.success) {
                setShowSuccess(true);
                toast.success('Booking confirmed! check your mail.', { duration: 5000 });
            } else {
                console.error('Booking failed:', data.error);
                toast.error(`Payment verified but booking failed: ${data.error || 'Please contact support'}.`);
            }
        } catch (error) {
            console.error('Booking confirmation error:', error);
            toast.error('Failed to confirm booking.');
        } finally {
            setIsPayOpen(false);
        }
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full rounded-3xl border-0 shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-green-600 w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Session Booked!</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Your session with <span className="text-purple-600 font-bold">{expert.name}</span> has been successfully confirmed.
                            <br /><br />
                            <span className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold">
                                Please check your email for the Calendly invite!
                            </span>
                        </p>
                        <div className="space-y-3 w-full">
                            <Button
                                onClick={() => router.push('/expert/dashboard')}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-6 rounded-2xl font-bold transition-all"
                            >
                                Go to Dashboard
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => router.push('/experts')}
                                className="w-full text-gray-400 hover:text-gray-600 font-medium"
                            >
                                Back to Marketplace
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-white text-gray-500 flex items-center gap-2"
                    onClick={() => router.push('/experts')}
                >
                    <ArrowLeft size={18} />
                    Back to Experts
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Profile Info */}
                        <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-50 rounded-bl-[100px] -z-0 opacity-50" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                                        {expert.picture_url ? (
                                            <img src={expert.picture_url} alt={expert.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="text-gray-300" size={48} />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-gray-900">{expert.name}</h1>
                                        <div className="flex items-center gap-1 text-amber-500 bg-amber-50 px-3 py-1 rounded-full w-fit mt-2">
                                            <Star size={16} fill="currentColor" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Top Expert</span>
                                        </div>
                                        <p className="text-purple-600 font-bold mt-2 bg-purple-50 px-3 py-1 rounded-full text-sm inline-block">
                                            {expert.expertise}
                                        </p>
                                    </div>
                                </div>

                                <div className="prose prose-purple max-w-none">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Info size={20} className="text-purple-600" />
                                        About the Expert
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">
                                        {expert.description || "Top-rated expert providing specialized sessions and guidance in their field."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Why book */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="rounded-[30px] border-0 shadow-sm bg-blue-50/50">
                                <CardContent className="p-8">
                                    <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                                        <ShieldCheck size={24} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Guaranteed Quality</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Each expert is vetted to ensure you get high-quality professional guidance.
                                    </p>
                                </CardContent>
                            </Card>
                            <Card className="rounded-[30px] border-0 shadow-sm bg-purple-50/50">
                                <CardContent className="p-8">
                                    <div className="bg-purple-100 text-purple-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                                        <MessageSquare size={24} />
                                    </div>
                                    <h4 className="font-bold text-gray-900 mb-2 text-lg">Direct Access</h4>
                                    <p className="text-sm text-gray-500 leading-relaxed">
                                        Get 1:1 attention and answers to your specific professional questions.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-24 rounded-[40px] border-0 shadow-2xl shadow-purple-100/50 bg-white overflow-hidden">
                            <CardHeader className="bg-gray-900 text-white p-8">
                                <CardTitle className="text-center text-sm uppercase tracking-[0.2em] font-black opacity-60 mb-2">
                                    Investment
                                </CardTitle>
                                <div className="text-center">
                                    <span className="text-5xl font-black">{parseFloat(expert.session_amount_icp).toFixed(2)}</span>
                                    <span className="text-xl font-bold ml-2 opacity-60">ICP</span>
                                </div>
                                <p className="text-center text-xs mt-4 opacity-50 font-medium italic">
                                    Includes full preparation materials and session recording
                                </p>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="space-y-6 mb-10">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <CheckCircle2 size={18} className="text-green-500" />
                                        1-Hour Individual Session
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <CheckCircle2 size={18} className="text-green-500" />
                                        Instant Calendly Invite
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <CheckCircle2 size={18} className="text-green-500" />
                                        Actionable Strategy Plan
                                    </div>
                                </div>

                                <Button
                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-8 text-xl font-black rounded-3xl shadow-xl shadow-purple-200 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                    onClick={() => setIsPayOpen(true)}
                                >
                                    Confirm & Pay
                                </Button>

                                <div className="mt-8 flex items-center justify-center gap-2 opacity-40">
                                    <ShieldCheck size={14} />
                                    <p className="text-[10px] uppercase font-bold tracking-widest">Secure ICPay Transaction</p>
                                </div>
                            </CardContent>
                        </Card>

                        {isPayOpen && (
                            <StripeCheckout
                                endpoint="/api/payments/expert-session"
                                payload={{
                                    expert_id: expert.id,
                                    scheduled_at: new Date().toISOString(),
                                    duration_minutes: 60,
                                }}
                                onSuccess={handlePaymentSuccess}
                                onError={() => setIsPayOpen(false)}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
