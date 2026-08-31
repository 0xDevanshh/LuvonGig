'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
const LoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push('/clientorfreelancer');
      } else {
        setError(result.error || 'An error occurred');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Legacy handleLogin for compatibility
  const handleLogin = (e: React.FormEvent) => {
    handleSubmit(e);
  };
  return <div className="max-w-md w-full mx-auto px-4">
    <div className="text-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800">LogIn Here</h1>
      <h2 className="text-3xl font-bold text-gray-800">Fill the details</h2>
    </div>
    {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md mb-4">
      {error}
    </div>}
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="email"
            name="email"
            placeholder="Enter your email id"
            className="w-full px-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter your password here"
            className="w-full px-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 pr-12"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff className="text-gray-400 w-5 h-5" /> : <Eye className="text-gray-400 w-5 h-5" />}
          </button>
        </div>
        <div className="flex justify-between items-center mt-2">
          <Link href="/forgot-password" className="text-red-500 text-sm">
            Forgot Password?
          </Link>
        </div>
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-black text-white py-3 px-4 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Signing in...' : 'Login'}
      </button>
    </form>
    <div className="mt-6 text-center">
      <p className="text-gray-700">
        Don't Have an Account ?{' '}
        <Link href="/signup" className="text-green-600 font-medium">
          SignUp
        </Link>
      </p>
    </div>
    <div className="mt-6">
      <button className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-full py-3 px-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        Login with Google
      </button>
    </div>
    <div className="mt-8 text-center text-sm text-gray-600">
      <p>
        by Logging In, i agree with Workbudd{' '}
        <Link href="/privacy-policy" className="text-indigo-600">
          privacy policy
        </Link>
        <br />
        and{' '}
        <Link href="/terms" className="text-indigo-600">
          terms and conditions
        </Link>
      </p>
    </div>
  </div>;
};
export default LoginForm;