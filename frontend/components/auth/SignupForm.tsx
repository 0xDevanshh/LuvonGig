import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
const SignUpForm = () => {
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
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const validateForm = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      firstName?: string;
      lastName?: string;
    } = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordRequirements = [
        { test: formData.password.length >= 8, message: 'Password must be at least 8 characters long' },
        { test: /[A-Z]/.test(formData.password), message: 'Password must contain at least one uppercase letter' },
        { test: /[a-z]/.test(formData.password), message: 'Password must contain at least one lowercase letter' },
        { test: /\d/.test(formData.password), message: 'Password must contain at least one number' },
        { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), message: 'Password must contain at least one special character' }
      ];

      for (const requirement of passwordRequirements) {
        if (!requirement.test) {
          newErrors.password = requirement.message;
          break;
        }
      }
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!validateForm()) {
      setIsLoading(false);
      return;
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
  return <div className="max-w-md w-full mx-auto px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Sign Up Here to</h1>
        <h2 className="text-3xl font-bold text-gray-800">create new account</h2>
      </div>

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            {errors.firstName && <p className="text-red-500 text-sm mt-1 ml-4">{errors.firstName}</p>}
          </div>

          <div>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-12 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            {errors.lastName && <p className="text-red-500 text-sm mt-1 ml-4">{errors.lastName}</p>}
          </div>
        </div>
        {/* Email field */}
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
            />
          </div>
          {errors.email && <p className="text-red-500 text-sm mt-1 ml-4">{errors.email}</p>}
        </div>

        {/* Password field */}
        <div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Enter your password here"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400 pr-12"
              value={formData.password}
              onChange={handleChange}
              onFocus={() => setShowPasswordTooltip(true)}
              onBlur={() => setShowPasswordTooltip(false)}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="text-gray-400 w-5 h-5" /> : <Eye className="text-gray-400 w-5 h-5" />}
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
          {errors.password && <p className="text-red-500 text-sm mt-1 ml-4">{errors.password}</p>}
        </div>

        {/* Confirm password field */}
        <div>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm your password here"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="text-gray-400 w-5 h-5" /> : <Eye className="text-gray-400 w-5 h-5" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1 ml-4">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-black text-white py-3 px-4 rounded-full font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <div className="mt-6 text-center">
        <p className="text-gray-700">
          Already Have an Account ?{' '}
          <a href="#" className="text-green-600 font-medium">
            LogIn
          </a>
        </p>
      </div>
      <div className="mt-6">
        <button className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-full py-3 px-4 font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign Up with Google
        </button>
      </div>
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>
          by Signing Up, i agree with Organaise{' '}
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
export default SignUpForm;