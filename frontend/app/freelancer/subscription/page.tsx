'use client'

import React, { useState, useEffect } from 'react'
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
    CreditCard
} from 'lucide-react'
import { useUserContext } from '@/contexts/UserContext'
import StripeCheckout from '@/components/payment/StripeCheckout'
import { PageHeader } from '@/components/ui/page-header'
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog"

export default function SubscriptionPage() {
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
            const usageRes = await fetch(`/api/subscription?email=${profile.email}`)
            const usageResult = await usageRes.json()
            if (usageResult.success) {
                setUsage(usageResult.data)
            }

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
                fetchUsage()
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
            handleUpgrade(plan)
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

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="size-10 animate-spin text-primary" />
            </div>
        )
    }

    const messageLimit = usage?.plan === 'Premium' ? 15 : 5
    const messageUsagePercent = usage ? (usage.daily_messages_count / messageLimit) * 100 : 0

    const connectOptions = [
        { amount: 10, usdAmount: 2, label: 'Starter' },
        { amount: 35, usdAmount: 6, label: 'Spark', popular: true },
        { amount: 65, usdAmount: 10, label: 'Supercharge' }
    ]

    return (
        <div className="p-6 pb-20">
            <PageHeader title="Subscription & bidding" description="Manage your freelancer plan and bidding capacity." />

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary-hover">
                                <ShieldCheck className="size-5" />
                            </div>
                            <Badge>{usage?.plan || 'Basic'}</Badge>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground">Subscription plan</h3>
                        <p className="mt-1 text-2xl font-bold text-foreground">{usage?.plan === 'Premium' ? 'Premium Pro' : 'Free Basic'}</p>
                        {usage?.plan === 'Premium' && usage.plan_expires_at && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Activity className="size-3" />
                                Expires {new Date(usage.plan_expires_at).toLocaleDateString()}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
                                <Zap className="size-5" />
                            </div>
                            <p className="rounded bg-warning/10 px-2 py-0.5 text-xs font-bold text-warning">Bidding power</p>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground">Connects balance</h3>
                        <p className="mt-1 text-3xl font-black text-foreground">{usage?.connects || 0}</p>
                        <p className="mt-2 text-xs text-muted-foreground">Available for bidding on jobs</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="mb-4 flex items-start justify-between">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-success/10 text-success">
                                <MessageSquare className="size-5" />
                            </div>
                            <span className="font-mono text-xs text-muted-foreground">{usage?.daily_messages_count || 0} / {messageLimit}</span>
                        </div>
                        <h3 className="text-sm font-medium text-muted-foreground">Daily outbound messages</h3>
                        <Progress value={messageUsagePercent} className="mt-3 h-1.5" />
                        <p className="mt-2 text-[10px] italic text-muted-foreground">Resets every 24 hours</p>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
                <div className="space-y-10 lg:col-span-8">
                    <div className="rounded-2xl border border-border bg-surface p-8">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="font-heading text-h3 font-semibold text-foreground">Get more connects</h2>
                                <p className="text-sm text-muted-foreground">Boost your bidding capacity instantly.</p>
                            </div>
                            <Badge variant="outline">Secure payments</Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {connectOptions.map((opt) => (
                                <button
                                    key={opt.usdAmount}
                                    onClick={() => openConnectsCheckout(opt.amount, opt.usdAmount)}
                                    className={`relative flex flex-col justify-between rounded-xl border p-5 text-left transition-colors ${opt.popular
                                        ? 'border-primary bg-primary-soft'
                                        : 'border-border bg-background hover:border-primary/40'
                                        }`}
                                >
                                    {opt.popular && (
                                        <span className="absolute -top-3 left-4 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">Most popular</span>
                                    )}
                                    <div className="mb-2 flex items-center gap-2">
                                        <Zap className="size-4 text-primary" />
                                        <span className="text-xs font-bold text-muted-foreground">{opt.label}</span>
                                    </div>
                                    <div>
                                        <span className="text-2xl font-black text-foreground">{opt.amount}</span>
                                        <span className="ml-1 text-xs text-muted-foreground">Connects</span>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <span className="font-bold text-foreground">${opt.usdAmount}</span>
                                        <div className="rounded-full border border-border bg-surface p-1">
                                            <ArrowRight className="size-3.5 text-primary" />
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div className={`rounded-2xl border-2 p-8 transition-all ${usage?.plan === 'Basic' ? 'border-primary bg-surface' : 'border-border bg-background'}`}>
                            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Standard flow</h3>
                            <div className="mb-6 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-foreground">$0</span>
                                <span className="text-sm font-medium text-muted-foreground">/ forever</span>
                            </div>
                            <h4 className="mb-6 text-xl font-bold text-foreground">Basic plan</h4>
                            <ul className="mb-8 space-y-4">
                                {['30 monthly connects', '5 direct messages / day', '4% platform fee'].map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-muted-foreground">
                                        <CheckCircle2 className="size-4 text-success" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className="h-12 w-full"
                                variant={usage?.plan === 'Basic' ? 'outline' : 'default'}
                                disabled={usage?.plan === 'Basic'}
                                onClick={() => handleUpgrade('Basic')}
                            >
                                {usage?.plan === 'Basic' ? 'Current plan' : 'Select Basic'}
                            </Button>
                        </div>

                        <div className={`relative overflow-hidden rounded-2xl border-2 p-8 transition-all ${usage?.plan === 'Premium' ? 'border-primary bg-surface' : 'border-border bg-surface shadow-md'}`}>
                            <div className="absolute right-0 top-0 p-4">
                                <Badge>Recommended</Badge>
                            </div>
                            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">Pro growth</h3>
                            <div className="mb-6 flex items-baseline gap-1">
                                <span className="text-4xl font-black text-foreground">$20</span>
                                <span className="text-sm font-medium text-muted-foreground">/ month</span>
                            </div>
                            <h4 className="mb-6 text-xl font-bold text-foreground">Premium Pro</h4>
                            <ul className="mb-8 space-y-4">
                                {['60 monthly connects', '15 direct messages / day', '3% platform fee', 'Priority listing support'].map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-sm font-medium text-foreground">
                                        <CheckCircle2 className="size-4 text-primary" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                            <Button
                                className="h-12 w-full"
                                variant={usage?.plan === 'Premium' ? 'secondary' : 'default'}
                                disabled={usage?.plan === 'Premium' || !!actionLoading}
                                onClick={() => openUpgradeCheckout('Premium')}
                            >
                                {actionLoading === 'Premium' ? <Loader2 className="size-4 animate-spin" /> :
                                    usage?.plan === 'Premium' ? 'Active Premium' : 'Upgrade to Pro'}
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6 lg:col-span-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="size-4 text-primary" />
                                Account logs
                            </CardTitle>
                            <CardDescription>Your bidding and plan activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="max-h-[400px] space-y-4 overflow-y-auto">
                                {history.length > 0 ? history.map((item: any) => (
                                    <div key={item.id} className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium leading-tight text-foreground">{item.description}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className={`rounded px-2 py-1 text-xs font-bold ${item.amount < 0 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'}`}>
                                            {item.amount > 0 ? '+' : ''}{item.amount}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="py-10 text-center text-xs italic text-muted-foreground">No recent activity detected.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="rounded-2xl bg-foreground p-6 text-background">
                        <h3 className="mb-2 flex items-center gap-2 font-heading text-lg font-bold">
                            <ShieldCheck className="size-5" />
                            Pro guarantee
                        </h3>
                        <p className="mb-6 text-sm text-background/70">
                            Premium members get protected payments and higher visibility in the job marketplace.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl bg-background/10 p-3">
                                <p className="mb-1 text-xs font-bold">3.0%</p>
                                <p className="text-[10px] text-background/60">Industry lowest fee</p>
                            </div>
                            <div className="rounded-xl bg-background/10 p-3">
                                <p className="mb-1 text-xs font-bold">Top 5%</p>
                                <p className="text-[10px] text-background/60">Ranking priority</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
                <DialogContent className="overflow-hidden rounded-2xl border-none p-0 sm:max-w-md">
                    <div className="flex items-center justify-between border-b border-border bg-secondary p-8">
                        <div className="flex items-center gap-4">
                            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                                <CreditCard className="size-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-foreground">Secure purchase</h2>
                                <p className="mt-0.5 text-xs text-muted-foreground">Processed securely by Stripe</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 p-8">
                        <div className="relative overflow-hidden rounded-2xl bg-foreground p-6 text-background">
                            <div className="absolute right-0 top-0 rounded-bl-xl bg-primary p-2 text-[10px] font-bold uppercase">Order detail</div>

                            <div className="mb-6 flex items-center justify-between">
                                <p className="text-sm font-medium text-background/60">Items selected</p>
                                <p className="font-bold">
                                    {checkoutData?.type === 'upgrade'
                                        ? `Premium Pro (${checkoutData.plan})`
                                        : `${checkoutData?.amount} Additional Connects`}
                                </p>
                            </div>

                            <div className="space-y-3 border-t border-background/10 pt-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-background/60">Current balance</p>
                                    <p className="font-mono text-xs">{usage?.connects || 0}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-success">New connects</p>
                                    <p className="font-mono text-xs text-success">+{checkoutData?.type === 'upgrade' ? 60 : (checkoutData?.amount || 0)}</p>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-sm font-bold underline decoration-primary/50 underline-offset-4">New total balance</p>
                                    <p className="font-mono text-sm font-black text-primary">
                                        {(usage?.connects || 0) + (checkoutData?.type === 'upgrade' ? 60 : (checkoutData?.amount || 0))}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-10 flex items-end justify-between">
                                <div>
                                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-background/50">Amount due</p>
                                    <p className="text-4xl font-black">${checkoutData?.usdAmount}</p>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-background/50">
                                    <ShieldCheck className="size-3" />
                                    <span>Instant delivery</span>
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

                    <div className="flex items-center justify-center gap-6 bg-secondary p-6">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight text-muted-foreground">
                            <ShieldCheck className="size-3.5" />
                            <span>Secured by Stripe</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
