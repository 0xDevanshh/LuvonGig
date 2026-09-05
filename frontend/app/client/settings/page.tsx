'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/ui/page-header';
import { Lock, RefreshCw, CheckCircle } from 'lucide-react';

export default function ClientSettingsPage() {
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [passwordStatus, setPasswordStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle');

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
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      setPasswordStatus('submitted');
      setTimeout(() => setPasswordStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Password settings error:', error);
      window.alert(`Password reset failed: ${error?.message || 'Unknown error'}`);
      setPasswordStatus('idle');
    }
  };

  return (
    <div className="p-6">
      <PageHeader title="Settings" description="Manage your account security." />

      <div className="mx-auto mt-8 max-w-3xl space-y-6">
        <section className="space-y-6 rounded-xl border border-border bg-surface p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary-soft">
              <Lock className="size-5 text-primary-hover" />
            </div>
            <div>
              <h2 className="font-heading text-h3 font-semibold text-foreground">Login &amp; security</h2>
              <p className="text-sm text-muted-foreground">Maintain your account access credentials.</p>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handlePasswordSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })}
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={passwordStatus === 'submitting'}>
                {passwordStatus === 'submitting' ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : passwordStatus === 'submitted' ? (
                  <CheckCircle className="size-4" />
                ) : null}
                {passwordStatus === 'submitting'
                  ? 'Updating password...'
                  : passwordStatus === 'submitted'
                    ? 'Password updated'
                    : 'Update password'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
