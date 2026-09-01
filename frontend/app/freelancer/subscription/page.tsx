'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Zap,
    MessageSquare,
    Activity,
    ShieldCheck,
    CheckCircle2,
    ArrowRight,
    Loader2,
    DollarSign,
    AlertTriangle,
    CreditCard
} from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import StripeCheckout from '@/components/payment/StripeCheckout'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export default function SubscriptionPage() {
    const router = useRouter()
    const { profile } = useUserContext()
    const [usage, setUsage] = useState<any>(null)
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [checkoutData, setCheckoutData] = useState<{
        type: 'upgrade' | 'connects',
        plan?: string,
        amount?: number,
        usdAmount: number
    } | null>(null)
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

    const fetchUsage = async () => {
        if (!profile?.email) return
        try {
            // Fetch Usage
            const usageRes = await fetch(`/api/subscription?email=${profile.email}`)
            const usageResult = await usageRes.json()
            if (usageResult.success) {
                setUsage(usageResult.data)
            }

            // Fetch History
            const historyRes = await fetch(`/api/subscription/history?email=${profile.email}`)
            const historyResult = await historyRes.json()
            if (historyResult.success) {
                setHistory(historyResult.data)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsage()
    }, [profile?.email])

    const handlePaymentSuccess = async (paymentDetail: any) => {
        if (!profile?.email || !checkoutData) return

        setCheckoutData(null)
        setIsCheckoutOpen(false)
        setLoading(true)

        try {
            const response = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    action: checkoutData.type,
                    plan: checkoutData.plan,
                    amount: checkoutData.amount,
                    paymentId: paymentDetail.paymentId || 'sandbox_success',
                    transactionId: paymentDetail.transactionId || 'sandbox_tx'
                })
            })

            const result = await response.json()
            if (result.success) {
                setUsage(result.data)
                alert(`Success! Your purchase was successful.`)
                fetchUsage() // Refresh all data
            } else {
                alert('Verification failed: ' + result.error)
            }
        } catch (error) {
            console.error('Payment verification error:', error)
            alert('An error occurred during payment verification.')
        } finally {
            setLoading(false)
        }
    }

    const openUpgradeCheckout = (plan: string) => {
        if (plan === 'Premium') {
            setCheckoutData({
                type: 'upgrade',
                plan: 'Premium',
                usdAmount: 20
            })
            setIsCheckoutOpen(true)
        } else {
            handleUpgrade(plan) // Basic is free
        }
    }

    const openConnectsCheckout = (amount: number, usdAmount: number) => {
        setCheckoutData({
            type: 'connects',
            amount,
            usdAmount
        })
        setIsCheckoutOpen(true)
    }

    const handleUpgrade = async (plan: string) => {
        if (!profile?.email) return

        setActionLoading(plan)
        try {
            // Simulation: Mock payment confirmation
            const response = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    action: 'upgrade',
                    plan: plan
                })
            })

            const result = await response.json()
            if (result.success) {
                setUsage(result.data)
                alert(`Success! You are now on the ${plan} plan. Your subscription will renew monthly.`)
            } else {
                alert('Upgrade failed: ' + result.error)
            }
        } catch (error) {
            console.error('Action error:', error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleBuyConnects = async (amount: number) => {
        if (!profile?.email) return

        setActionLoading('connects')
        try {
            const response = await fetch('/api/subscription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: profile.email,
                    action: 'add-connects',
                    amount: amount
                })
            })

            const result = await response.json()
            if (result.success) {
                setUsage(result.data)
                alert(`Success! ${amount} connects added to your balance.`)
            }
        } catch (error) {
            console.error('Action error:', error)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        )
    }

    const messageLimit = usage?.plan === 'Premium' ? 15 : 5
    const messageUsagePercent = usage ? (usage.daily_messages_count / messageLimit) * 100 : 0

    const connectOptions = [
        { amount: 10, usdAmount: 2, label: 'Starter', icon: <Zap className="w-4 h-4 text-blue-500" /> },
        { amount: 35, usdAmount: 6, label: 'Spark', icon: <Zap className="w-4 h-4 text-yellow-500" />, popular: true },
        { amount: 65, usdAmount: 10, label: 'Supercharge', icon: <Zap className="w-4 h-4 text-purple-500" /> }
    ]

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-20 text-slate-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div>
                        <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 font-semibold uppercase tracking-wider text-[10px]">
                            Workspace Management
                        </Badge>
                        <h1 className="text-4xl font-extrabold tracking-tight">Subscription & Bidding</h1>
                        <p className="text-slate-500 mt-1 text-lg">Manage your freelancer plan and bidding capacity.</p>
                    </div>
                </div>

                {/* Top Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Active Plan Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden group">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <ShieldCheck size={20} />
                                </div>
                                <Badge className={usage?.plan === 'Premium' ? 'bg-purple-600 border-none' : 'bg-blue-600 border-none'}>
                                    {usage?.plan || 'Basic'}
                                </Badge>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Subscription Plan</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                                <p className="text-2xl font-bold">{usage?.plan === 'Premium' ? 'Premium Pro' : 'Free Basic'}</p>
                            </div>
                            {usage?.plan === 'Premium' && usage.plan_expires_at && (
                                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                                    <Activity size={12} />
                                    Expires {new Date(usage.plan_expires_at).toLocaleDateString()}
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Connects Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                                    <Zap size={20} />
                                </div>
                                <p className="text-xs text-yellow-600 font-bold bg-yellow-50 px-2 py-0.5 rounded">Bidding Power</p>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Connects Balance</h3>
                            <p className="text-3xl font-black mt-1">{usage?.connects || 0}</p>
                            <p className="text-xs text-slate-400 mt-2">Available for bidding on jobs</p>
                        </CardContent>
                    </Card>

                    {/* Messages Card */}
                    <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                                    <MessageSquare size={20} />
                                </div>
                                <span className="text-xs text-slate-400 font-mono">{usage?.daily_messages_count || 0} / {messageLimit}</span>
                            </div>
                            <h3 className="text-slate-500 text-sm font-medium">Daily Outbound Messages</h3>
                            <div className="mt-3">
                                <Progress value={messageUsagePercent} className="h-1.5 bg-slate-100" />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 italic">Resets every 24 hours</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content: Plans & Tiered Connects */}
                    <div className="lg:col-span-8 space-y-10">
                        {/* Tiered Connects Section */}
                        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-bold">Get More Connects</h2>
                                    <p className="text-slate-500 text-sm">Boost your bidding capacity instantly.</p>
                                </div>
                                <Badge variant="outline" className="border-slate-200 text-slate-400">Secure Payments</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {connectOptions.map((opt) => (
                                    <button
                                        key={opt.usdAmount}
                                        onClick={() => openConnectsCheckout(opt.amount, opt.usdAmount)}
                                        className={`relative p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between hover:scale-[1.02] active:scale-95 ${opt.popular
                                                ? 'border-blue-500 bg-blue-50/30'
                                                : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                                            }`}
                                    >
                                        {opt.popular && (
                                            <span className="absolute -top-3 left-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Most Popular</span>
                                        )}
                                        <div className="flex items-center gap-2 mb-2">
                                            {opt.icon}
                                            <span className="text-xs font-bold text-slate-600">{opt.label}</span>
                                        </div>
                                        <div>
                                            <span className="text-2xl font-black">{opt.amount}</span>
                                            <span className="text-xs text-slate-500 ml-1">Connects</span>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="font-bold">${opt.usdAmount}</span>
                                            <div className="p-1 bg-white rounded-full shadow-sm border border-slate-100">
                                                <ArrowRight size={14} className="text-blue-500" />
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Subscription Plans */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Card */}
                            <div className={`p-8 rounded-3xl border-2 transition-all ${usage?.plan === 'Basic' ? 'border-blue-500 bg-white ring-8 ring-blue-50/50' : 'border-slate-100 bg-slate-50/30'}`}>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Standard Flow</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-black">$0</span>
                                    <span className="text-slate-400 text-sm font-medium">/ forever</span>
                                </div>
                                <h4 className="text-xl font-bold mb-6">Basic Plan</h4>
                                <ul className="space-y-4 mb-8">
                                    {[
                                        '30 Monthly Connects',
                                        '5 Direct Messages / Day',
                                        '4% Platform Fee'
                                    ].map(f => (
                                        <li key={f} className="flex items-center gap-3 text-sm text-slate-600">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className="w-full h-12 rounded-xl"
                                    variant={usage?.plan === 'Basic' ? 'outline' : 'default'}
                                    disabled={usage?.plan === 'Basic'}
                                    onClick={() => handleUpgrade('Basic')}
                                >
                                    {usage?.plan === 'Basic' ? 'Current Plan' : 'Select Basic'}
                                </Button>
                            </div>

                            {/* Premium Card */}
                            <div className={`p-8 rounded-3xl border-2 transition-all relative overflow-hidden ${usage?.plan === 'Premium' ? 'border-purple-500 bg-white ring-8 ring-purple-50/50' : 'border-slate-100 bg-white shadow-xl shadow-slate-200/50'}`}>
                                <div className="absolute top-0 right-0 p-4">
                                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 border-none text-[10px] font-bold">Recommended</Badge>
                                </div>
                                <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Pro Growth</h3>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-4xl font-black">$20</span>
                                    <span className="text-slate-400 text-sm font-medium">/ month</span>
                                </div>
                                <h4 className="text-xl font-bold mb-6">Premium Pro</h4>
                                <ul className="space-y-4 mb-8">
                                    {[
                                        '60 Monthly Connects',
                                        '15 Direct Messages / Day',
                                        '3% Platform Fee',
                                        'Priority Listing Support'
                                    ].map(f => (
                                        <li key={f} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                                            <CheckCircle2 className="w-4 h-4 text-purple-600" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className={`w-full h-12 rounded-xl font-bold text-white transition-all ${usage?.plan === 'Premium'
                                            ? 'bg-slate-100 text-slate-400 hover:bg-slate-100'
                                            : 'bg-[#0F172A] hover:bg-[#1E293B] shadow-lg shadow-slate-200'
                                        }`}
                                    disabled={usage?.plan === 'Premium' || !!actionLoading}
                                    onClick={() => openUpgradeCheckout('Premium')}
                                >
                                    {actionLoading === 'Premium' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                        usage?.plan === 'Premium' ? 'Active Premium' : 'Upgrade to Pro'}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar Content: Connects History & FAQ */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-3xl overflow-hidden">
                            <CardHeader className="pb-4 px-6 pt-6">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    Account Logs
                                </CardTitle>
                                <CardDescription className="text-xs">Your bidding and plan activity</CardDescription>
                            </CardHeader>
                            <CardContent className="px-0 pb-2">
                                <div className="max-h-[400px] overflow-y-auto px-6 space-y-4 pb-4 custom-scrollbar">
                                    {history.length > 0 ? history.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center group">
                                            <div className="space-y-0.5">
                                                <p className="text-[13px] font-medium text-slate-700 leading-tight">{item.description}</p>
                                                <p className="text-[10px] text-slate-400">
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded ${item.amount < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                {item.amount > 0 ? '+' : ''}{item.amount}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-xs text-slate-400 italic text-center py-10">No recent activity detected.</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-6 bg-[#0F172A] rounded-3xl text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full group-hover:bg-blue-500/30 transition-all"></div>
                            <h3 className="font-bold text-lg mb-2 relative z-10 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                                Pro Guarantee
                            </h3>
                            <p className="text-slate-400 text-sm relative z-10 mb-6">
                                Premium members get protected payments and higher visibility in the job marketplace.
                            </p>
                            <div className="grid grid-cols-2 gap-4 relative z-10">
                                <div className="p-3 bg-white/5 rounded-2xl">
                                    <p className="text-blue-400 text-xs font-bold mb-1">3.0%</p>
                                    <p className="text-[10px] text-slate-500">Industry Lowest Fee</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-2xl">
                                    <p className="text-emerald-400 text-xs font-bold mb-1">Top 5%</p>
                                    <p className="text-[10px] text-slate-500">Ranking Priority</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkout Dialog */}
                <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                    <DialogContent className="sm:max-w-md bg-white border-none rounded-3xl p-0 overflow-hidden shadow-2xl">
                        <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Secure Purchase</h2>
                                    <p className="text-slate-500 text-xs mt-0.5">Authorized via ICPay Secure Network</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="p-6 bg-[#0F172A] rounded-2xl text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 bg-blue-600 p-2 rounded-bl-xl text-[10px] font-bold uppercase">Order Detail</div>

                                <div className="flex justify-between items-center mb-6">
                                    <p className="text-slate-400 text-sm font-medium">Items selected</p>
                                    <p className="text-white font-bold">
                                        {checkoutData?.type === 'upgrade'
                                            ? `Premium Pro (${checkoutData.plan})`
                                            : `${checkoutData?.amount} Additional Connects`}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <p className="text-slate-400 text-xs">Current Balance</p>
                                        <p className="text-white text-xs font-mono">{usage?.connects || 0}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-emerald-400 text-xs font-semibold">New Connects</p>
                                        <p className="text-emerald-400 text-xs font-mono">+{checkoutData?.type === 'upgrade' ? 60 : (checkoutData?.amount || 0)}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <p className="text-white text-sm font-bold underline decoration-blue-500/50 underline-offset-4">New Total Balance</p>
                                        <p className="text-blue-400 text-sm font-black font-mono">
                                            {(usage?.connects || 0) + (checkoutData?.type === 'upgrade' ? 60 : (checkoutData?.amount || 0))}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end mt-10">
                                    <div>
                                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Amount Due</p>
                                        <p className="text-4xl font-black text-white">${checkoutData?.usdAmount}</p>
                                    </div>
                                    <div className="flex items-center gap-1 text-slate-500 text-[10px]">
                                        <ShieldCheck size={12} />
                                        <span>Instant Delivery</span>
                                    </div>
                                </div>
                            </div>

                            {checkoutData && (
                                <StripeCheckout
                                    endpoint="/api/payments/subscription"
                                    payload={{ plan: checkoutData.plan }}
                                    onSuccess={handlePaymentSuccess}
                                    onError={(err) => {
                                        console.error('Payment error:', err)
                                    }}
                                />
                            )}
                        </div>

                        <div className="p-6 bg-slate-50 flex items-center justify-center gap-6">
                            <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default text-slate-900 font-bold">
                                <ShieldCheck size={14} className="text-slate-600" />
                                <span className="text-[10px] items-center uppercase tracking-tighter">Verified by ICPay</span>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
