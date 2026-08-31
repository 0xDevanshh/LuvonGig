'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useUserContext } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';

interface WalletInfo {
  principal: string;
  accountId: string;
}

export default function ClientSettingsPage() {
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

  const handleProfileSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileStatus('saving');
    try {
      const response = await fetch('/api/user/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }
      setProfileStatus('saved');
      window.alert('Profile updated successfully.');
      refreshProfile();
    } catch (error: any) {
      console.error('Settings profile error:', error);
      window.alert(`Failed to update profile: ${error?.message || 'Unknown error'}`);
      setProfileStatus('idle');
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    } catch (error: any) {
      console.error('Password settings error:', error);
      window.alert(`Password reset failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setPasswordStatus('idle');
    }
  };

  const walletSummary = useMemo(() => {
    if (!walletInfo) return 'No wallet connected yet.';
    return `Principal: ${walletInfo.principal} · Account ID: ${walletInfo.accountId}`;
  }, [walletInfo]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-gray-900">Client Settings</h1>
          <p className="text-gray-600">
            Update your profile information, reset your password, and manage wallet details.
          </p>
        </header>

        <section className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Wallet & Security</h2>
              <p className="text-sm text-gray-600">Managed via the user canister</p>
            </div>
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-800"
              onClick={loadWalletInfo}
            >
              {walletLoading ? 'Refreshing…' : 'Refresh wallet'}
            </button>
          </div>
          <div className="text-sm text-gray-600 leading-relaxed">
            {walletSummary}
          </div>
          <form className="space-y-3" onSubmit={handlePasswordSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring focus:ring-purple-200 focus:outline-none"
                />
              </div>
            </div>
            <Button type="submit" variant="secondary" disabled={passwordStatus === 'submitting'}>
              {passwordStatus === 'submitting' ? 'Updating…' : 'Reset password'}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

