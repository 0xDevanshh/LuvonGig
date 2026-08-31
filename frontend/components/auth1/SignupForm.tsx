'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Mail, Lock } from 'lucide-react';

interface SignupFormProps {
  onSuccess?: () => void;
}

export default function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordTooltip, setShowPasswordTooltip] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    const passwordRequirements = [
      { test: formData.password.length >= 8, message: 'Password must be at least 8 characters long' },
      { test: /[A-Z]/.test(formData.password), message: 'Password must contain at least one uppercase letter' },
      { test: /[a-z]/.test(formData.password), message: 'Password must contain at least one lowercase letter' },
      { test: /\d/.test(formData.password), message: 'Password must contain at least one number' },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), message: 'Password must contain at least one special character' }
    ];

    for (const requirement of passwordRequirements) {
      if (!requirement.test) {
        setError(requirement.message);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(result.message || 'Account created successfully!');
        // Redirect to OTP verification page with email
        setTimeout(() => {
          router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        }, 1500);
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

  return (
    <>
    
    <div className="min-h-screen my-auto pt-40 max-w-md w-full mx-auto px-4">
      <h1 className="text-center text-3xl font-bold text-[#161616] mb-8">
        Sign Up Here to
        <br /> 
        create new account
      </h1>
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    
                  </div>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 
focus:ring-[#2ba24c] text-[#7d7d7d]"
                    placeholder="First name"
                  />
                </div>
              </div>
              
              <div>
              
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                   
                  </div>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 
focus:ring-[#2ba24c] text-[#7d7d7d]"
                    placeholder="Last name"
                  />
                </div>
              </div>
            </div>
        <div className="mb-4">
            
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
             id="email"
             name="email"
             type="email"
             autoComplete="email"
             required
             value={formData.email}
             onChange={handleChange}
              className="w-full py-3 px-12 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2
focus:ring-[#2ba24c] text-[#7d7d7d]"
             placeholder="Email address"
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="relative">
            <input
             id="password"
             name="password"
             type={showPassword ? 'text' : 'password'}
             autoComplete="new-password"
             required
             value={formData.password}
             onChange={handleChange}
             onFocus={() => setShowPasswordTooltip(true)}
             onBlur={() => setShowPasswordTooltip(false)}
              className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2
focus:ring-[#2ba24c] text-[#7d7d7d] pr-12"
             placeholder="Password"

            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
            {showPasswordTooltip && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10">
                <h4 className="font-medium mb-2">Password must:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-1">
                    <span className="text-xs">•</span> Have minimum 8 characters
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="text-xs">•</span> Have minimum 1 uppercase letter
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="text-xs">•</span> Have minimum 1 lowercase letter
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="text-xs">•</span> Have minimum 1 special character
                  </li>
                  <li className="flex items-center gap-1">
                    <span className="text-xs">•</span> Have minimum 1 digit
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="mb-6">
          <div className="relative">
            <input
               id="confirmPassword"
               name="confirmPassword"
               type={showConfirmPassword ? 'text' : 'password'}
               autoComplete="new-password"
               required
               value={formData.confirmPassword}
               onChange={handleChange}
              className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2
focus:ring-[#2ba24c] text-[#7d7d7d]"
               placeholder="Confirm password"

            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#000000] text-white py-3 rounded-full font-bold shadow-md hover:bg-gray-800
transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <p>
          Already Have an Account?{' '}
          <a href="/login" className="text-[#2ba24c] hover:underline">
            LogIn
          </a>
        </p>
      </div>
   
    </div>
    </>
  );
}
