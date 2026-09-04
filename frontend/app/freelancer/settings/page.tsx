'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useUserContext } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Shield, Wallet, Lock, RefreshCw, CheckCircle, AlertCircle, Landmark, ChevronRight } from 'lucide-react';

interface WalletInfo {
    principal: string;
    accountId: string;
}

export default function FreelancerSettingsPage() {
    const { profile, refreshProfile } = useUserContext();
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        location: '',
        phone: '',
        github: '',
        linkedin: '',
        website: '',
    });
    const [profileStatus, setProfileStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
    const [walletLoading, setWalletLoading] = useState(false);
    const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

    useEffect(() => {
        if (!profile.isLoaded) return;
        setProfileForm((prev) => ({
            ...prev,
            firstName: profile.firstName || prev.firstName,
            lastName: profile.lastName || prev.lastName,
        }));
    }, [profile]);

    useEffect(() => {
        loadWalletInfo();
    }, []);

    const loadWalletInfo = async () => {
        setWalletLoading(true);
        try {
            const response = await fetch('/api/user/wallet');
            const data = await response.json();
            if (data.success && data.data) {
                setWalletInfo(data.data);
            } else {
                setWalletInfo(null);
            }
        } catch (error) {
            console.error('Failed to load wallet info:', error);
        } finally {
            setWalletLoading(false);
        }
    };

    const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!passwordForm.newPassword) {
            window.alert('Please enter a new password.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            window.alert('Passwords do not match. Please try again.');
            return;
        }
        setPasswordStatus('submitting');
        try {
            const response = await fetch('/api/user/settings/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newPassword: passwordForm.newPassword }),
            });
            const data = await response.json();
            if (!data.success) {
                throw new Error(data.error || 'Failed to update password');
            }
            window.alert('Password updated successfully.');
            setPasswordForm({ newPassword: '', confirmPassword: '' });
            setPasswordStatus('submitted');
            setTimeout(() => setPasswordStatus('idle'), 3000);
        } catch (error: any) {
            console.error('Password settings error:', error);
            window.alert(`Password reset failed: ${error?.message || 'Unknown error'}`);
            setPasswordStatus('idle');
        }
    };

    const walletSummary = useMemo(() => {
        if (!walletInfo) return 'No wallet connected yet.';
        return (
            <div className="space-y-2">
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Principal ID</span>
                    <code className="text-sm bg-gray-50 p-2 rounded border border-gray-100 break-all">{walletInfo.principal}</code>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account ID</span>
                    <code className="text-sm bg-gray-50 p-2 rounded border border-gray-100 break-all">{walletInfo.accountId}</code>
                </div>
            </div>
        );
    }, [walletInfo]);

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-10">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-600">
                        Manage your freelancer account security, credentials, and wallet integration.
                    </p>
                </header>

                {/* Payouts Section */}
                <Link
                    href="/freelancer/settings/payouts"
                    className="flex items-center justify-between bg-white rounded-xl border border-gray-200 p-8 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Landmark className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Payouts</h2>
                            <p className="text-sm text-gray-500">Connect a Stripe account to get paid for released work</p>
                        </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                </Link>

                {/* Wallet Section */}
                <section className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Wallet className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Wallet Details</h2>
                                <p className="text-sm text-gray-500">Infrastructure provided by the Internet Computer (ICP)</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                            onClick={loadWalletInfo}
                            disabled={walletLoading}
                        >
                            <RefreshCw className={`w-4 h-4 ${walletLoading ? 'animate-spin' : ''}`} />
                            {walletLoading ? 'Refreshing…' : 'Sync Wallet'}
                        </button>
                    </div>

                    <div className="bg-blue-50/30 rounded-xl p-6 border border-blue-100/50">
                        {walletSummary}
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-100">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Security Note:</strong> These identifiers are unique to your Internet Identity or wallet.
                            Do not share your private keys or seed phrases with anyone. Workbudd will never ask for them.
                        </p>
                    </div>
                </section>

                {/* Security Section */}
                <section className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Lock className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Login & Security</h2>
                            <p className="text-sm text-gray-500">Maintain your account access credentials</p>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handlePasswordSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700">New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordForm.confirmPassword}
                                    onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button
                                type="submit"
                                variant="default"
                                className={`bg-purple-600 hover:bg-purple-700 px-8 py-2.5 h-auto text-base font-semibold transition-all ${passwordStatus === 'submitted' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                disabled={passwordStatus === 'submitting'}
                            >
                                {passwordStatus === 'submitting' ? (
                                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                ) : passwordStatus === 'submitted' ? (
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                ) : null}
                                {passwordStatus === 'submitting' ? 'Updating Password...' :
                                    passwordStatus === 'submitted' ? 'Password Updated' : 'Update Password'}
                            </Button>
                        </div>
                    </form>
                </section>
            </div>
        </div>
    );
}
