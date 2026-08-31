'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
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
  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  // Countdown timer for OTP expiry
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Countdown timer for redirect after successful password reset
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
    // Auto focus to next input
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
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex(val => !val);
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
          setSuccess('Password reset successful! Redirecting to signup in 5 seconds...');
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
        setTimeLeft(600); // Reset timer to 10 minutes
        setCanResend(false);
        setOtp(Array(6).fill('')); // Clear OTP inputs
      } else {
        setError(result.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

    return <div className="min-h-screen my-auto pt-40 max-w-md w-full mx-auto px-4">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Back
        </button>
      </div>

      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail size={32} className="text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-[#161616] mb-4">
          {purpose === 'password-reset' ? 'Reset Your Password' : 'Verify Your Email'}
        </h1>
        <p className="text-gray-600">
          {purpose === 'password-reset'
            ? "We've sent a 6-digit password reset code to"
            : "We've sent a 6-digit verification code to"
          }
        </p>
        <p className="font-semibold text-[#161616]">{email}</p>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
          {isResetSuccessful && (
            <div className="mt-2 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 bg-green-200 rounded-full text-green-800 font-bold">
                {countdown}
              </div>
            </div>
          )}
        </div>
      )}

      {error && !isResetSuccessful && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      {!isResetSuccessful && (
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-4">
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
                  className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full bg-[#000000] text-white py-3 rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? 'Verifying...' : (purpose === 'password-reset' ? 'Reset Password' : 'Verify Email')}
          </button>
        </form>
      )}

      {!isResetSuccessful && (
        <div className="text-center">
          {timeLeft > 0 ? (
            <p className="text-gray-600 text-sm">
              Resend code in <span className="font-semibold">{formatTime(timeLeft)}</span>
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isLoading || !canResend}
              className="flex items-center justify-center mx-auto text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={16} className="mr-2" />
              Resend OTP
            </button>
          )}
        </div>
      )}
    </div>;
};
export default VerifyCodeForm;