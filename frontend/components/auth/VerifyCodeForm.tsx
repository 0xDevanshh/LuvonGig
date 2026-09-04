'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

const VerifyCodeForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const purpose = searchParams.get('purpose'); // 'signup' or 'password-reset'

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isResetSuccessful, setIsResetSuccessful] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  useEffect(() => {
    if (isResetSuccessful && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isResetSuccessful && countdown === 0) {
      router.push('/signup');
    }
  }, [isResetSuccessful, countdown, router]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(0, 1);
    setOtp(newOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain').trim();
    if (!/^\d+$/.test(pasteData)) return;
    const digits = pasteData.split('').slice(0, 6);
    const newOtp = [...otp];
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    setOtp(newOtp);
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      setIsLoading(false);
      return;
    }

    if (!email) {
      setError('Email is required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp: otpCode,
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (purpose === 'password-reset') {
          setIsResetSuccessful(true);
          setSuccess('Password reset successful! Redirecting to sign up in 5 seconds...');
        } else {
          setSuccess('Email verified successfully!');
          setTimeout(() => {
            router.push('/profile/complete');
          }, 1500);
        }
      } else {
        setError(result.error || 'Invalid OTP code');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || !email) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('OTP resent successfully!');
        setTimeLeft(600);
        setCanResend(false);
        setOtp(Array(6).fill(''));
      } else {
        setError(result.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back
      </button>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary-soft">
          <Mail className="size-5 text-primary-hover" />
        </div>
        <h1 className="font-heading text-h1 font-semibold text-foreground">
          {purpose === 'password-reset' ? 'Reset your password' : 'Verify your email'}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {purpose === 'password-reset'
            ? "We've sent a 6-digit password reset code to"
            : "We've sent a 6-digit verification code to"}
        </p>
        <p className="font-medium text-foreground">{email}</p>
      </div>

      {success && (
        <div className="mb-4 rounded-md border border-success/20 bg-success/10 px-4 py-2.5 text-sm text-success">
          {success}
          {isResetSuccessful && (
            <div className="mt-2 flex justify-center">
              <div className="flex size-8 items-center justify-center rounded-full bg-success/20 font-semibold text-success">
                {countdown}
              </div>
            </div>
          )}
        </div>
      )}

      {error && !isResetSuccessful && (
        <div className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isResetSuccessful && (
        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el: HTMLInputElement | null) => {
                  if (el) {
                    inputRefs.current[index] = el;
                  }
                }}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="size-12 rounded-lg border border-border text-center text-lg font-semibold text-foreground outline-none focus:ring-2 focus:ring-ring/50"
                required
              />
            ))}
          </div>

          <Button type="submit" disabled={isLoading || otp.join('').length !== 6} className="w-full">
            {isLoading
              ? 'Verifying...'
              : purpose === 'password-reset'
                ? 'Reset password'
                : 'Verify email'}
          </Button>
        </form>
      )}

      {!isResetSuccessful && (
        <div className="mt-6 text-center">
          {timeLeft > 0 ? (
            <p className="text-sm text-muted-foreground">
              Resend code in <span className="font-medium text-foreground">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading || !canResend}
              className="mx-auto flex items-center justify-center gap-1.5 text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw className="size-4" />
              Resend code
            </button>
          )}
        </div>
      )}
    </div>
  );
};
export default VerifyCodeForm;
