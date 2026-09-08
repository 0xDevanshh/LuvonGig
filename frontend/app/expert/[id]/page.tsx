"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
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
import { formatMoney } from '@/lib/currency';

interface Expert {
    id: string;
    name: string;
    avatar_url: string;
    headline: string;
    bio: string;
    expertise: string[];
    hourly_rate_minor: string;
    currency: string;
}

const DURATIONS = [30, 60, 90] as const;

function defaultScheduledAt() {
    // A day out, at the top of the next hour: a sane default that's always
    // in the future, without forcing the client to pick before seeing the form.
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    // <input type="datetime-local"> wants local time with no timezone suffix.
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function ExpertDetailsPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [expert, setExpert] = useState<Expert | null>(null);
    const [isPayOpen, setIsPayOpen] = useState(false);
    const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt());
    const [durationMinutes, setDurationMinutes] = useState<number>(60);
    const [notes, setNotes] = useState('');

    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const fetchExpert = async () => {
            try {
                const response = await fetch(`/api/experts/${id}`);
                const data = await response.json();
                if (data.success) {
                    setExpert(data.data);
                } else {
                    toast.error('Expert not found');
                    router.push('/experts');
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchExpert();
    }, [id, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    if (!expert) return null;

    // Payment is confirmed by Stripe's webhook, not by this callback — this
    // only reflects that the card was charged. See client/payment/[id]/page.tsx
    // for the same pattern.
    const handlePaymentSuccess = () => {
        setIsPayOpen(false);
        setShowSuccess(true);
        toast.success('Payment submitted!', { duration: 5000 });
    };

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <Card className="max-w-md w-full rounded-3xl border-0 shadow-2xl overflow-hidden bg-white">
                    <CardContent className="p-10 flex flex-col items-center text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="text-green-600 w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Payment Submitted!</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            Your session with <span className="text-purple-600 font-bold">{expert.name}</span> is being confirmed.
                            <br /><br />
                            <span className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold">
                                You'll get a confirmation email once the payment clears.
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

    const sessionAmountMinor = (BigInt(expert.hourly_rate_minor) * BigInt(durationMinutes)) / BigInt(60);

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
                                        {expert.avatar_url ? (
                                            <img src={expert.avatar_url} alt={expert.name} className="w-full h-full object-cover" />
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
                                            {expert.expertise.join(', ') || expert.headline}
                                        </p>
                                    </div>
                                </div>

                                <div className="prose prose-purple max-w-none">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <Info size={20} className="text-purple-600" />
                                        About the Expert
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed text-lg">
                                        {expert.bio || "Top-rated expert providing specialized sessions and guidance in their field."}
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
                                    <span className="text-5xl font-black">
                                        {formatMoney(sessionAmountMinor.toString(), expert.currency)}
                                    </span>
                                </div>
                                <p className="text-center text-xs mt-4 opacity-50 font-medium italic">
                                    {formatMoney(expert.hourly_rate_minor, expert.currency)}/hr, billed for the time you book
                                </p>
                            </CardHeader>
                            <CardContent className="p-10">
                                <div className="space-y-5 mb-8">
                                    <div>
                                        <label htmlFor="scheduled-at" className="block text-sm font-medium text-gray-700 mb-1">
                                            When would you like to meet?
                                        </label>
                                        <input
                                            id="scheduled-at"
                                            type="datetime-local"
                                            value={scheduledAt}
                                            onChange={(e) => setScheduledAt(e.target.value)}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                                            Duration
                                        </label>
                                        <select
                                            id="duration"
                                            value={durationMinutes}
                                            onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            {DURATIONS.map((d) => (
                                                <option key={d} value={d}>{d} minutes</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                                            What would you like to discuss? <span className="text-gray-400">(optional)</span>
                                        </label>
                                        <textarea
                                            id="notes"
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            rows={3}
                                            className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3 mb-8">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <CheckCircle2 size={18} className="text-green-500" />
                                        1:1 Individual Session
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 font-medium">
                                        <CheckCircle2 size={18} className="text-green-500" />
                                        You arrange the meeting link with the expert after booking
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
                                    <p className="text-[10px] uppercase font-bold tracking-widest">Secure Card Payment</p>
                                </div>
                            </CardContent>
                        </Card>

                        {isPayOpen && (
                            <StripeCheckout
                                endpoint="/api/payments/expert-session"
                                payload={{
                                    expert_id: expert.id,
                                    scheduled_at: new Date(scheduledAt).toISOString(),
                                    duration_minutes: durationMinutes,
                                    notes: notes.trim() || undefined,
                                }}
                                amountMinor={sessionAmountMinor.toString()}
                                currency={expert.currency}
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
