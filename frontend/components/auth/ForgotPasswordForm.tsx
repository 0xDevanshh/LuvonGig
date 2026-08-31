'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft } from 'lucide-react';
const ForgotPasswordForm = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message || 'Please check your email for the password reset link.');
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Legacy handleSendCode for compatibility
  const handleSendCode = (e: React.FormEvent) => {
    handleSubmit(e);
  };
  return <div className="min-h-screen my-auto pt-40 max-w-md w-full mx-auto px-4">
    <div className="text-center mb-8">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Mail size={32} className="text-blue-600" />
      </div>
      <h1 className="text-3xl font-bold text-[#161616] mb-4">
        Forgot your password?
      </h1>
      <p className="text-gray-600">
        Enter your email address and we'll send you a code to reset your password
      </p>
    </div>

    {error && (
      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
        {error}
      </div>
    )}

    {success && (
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
        {success}
      </div>
    )}

    <form onSubmit={handleSendCode} className="space-y-6">
      <div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            placeholder="Enter your email id"
            className="w-full px-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-[#000000] text-white py-3 rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Sending...' : 'Send Reset Code'}
      </button>
    </form>

    <div className="text-center mt-6">
      <a
        href="/login"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to sign in
      </a>
    </div>
    <div className="mt-8 text-center text-sm text-gray-600">
      <p>
        by Logging In, i agree with Workbudd{' '}
        <a href="/privacy-policy" className="text-indigo-600">
          privacy policy
        </a>
        <br />
        and{' '}
        <a href="/terms" className="text-indigo-600">
          terms and conditions
        </a>
      </p>
    </div>
  </div>;
};
export default ForgotPasswordForm;