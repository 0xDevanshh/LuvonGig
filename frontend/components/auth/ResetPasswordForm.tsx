'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { resetPasswordAction } from '@/lib/actions/auth'
const ResetPasswordForm = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email') || localStorage.getItem('resetEmail') || 'user@example.com'

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6)
  }, [])
  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.substring(0, 1)
    setOtp(newOtp)
    // Auto focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text/plain').trim()
    if (!/^\d+$/.test(pasteData)) return
    const digits = pasteData.split('').slice(0, 6)
    const newOtp = [...otp]
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit
    })
    setOtp(newOtp)
    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((val) => !val)
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus()
    } else {
      inputRefs.current[5]?.focus()
    }
  }
  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasDigit = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password,
    )
    const hasMinLength = password.length >= 8
    return (
      hasUpperCase && hasLowerCase && hasDigit && hasSpecialChar && hasMinLength
    )
  }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    if (!token) {
      setError('Invalid reset token')
      setIsLoading(false)
      return
    }

 

    // Validate password
    if (!validatePassword(newPassword)) {
      setError("Password doesn't meet the requirements")
      setIsLoading(false)
      return
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match")
      setIsLoading(false)
      return
    }

    try {
      const formDataObj = new FormData()
      formDataObj.append('token', token)
      formDataObj.append('password', newPassword)
      formDataObj.append('confirmPassword', confirmPassword)

      const result = await resetPasswordAction(formDataObj)

      if (result.success) {
        setSuccess(result.message || 'Password reset successfully!')
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        setError(result.error || 'An error occurred')
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Invalid Reset Link
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <div className="mt-6">
              <a
                href="/forgot-password"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Request a new reset link
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full mx-auto px-4">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
         Change Password
        </h1>
       
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-2 rounded-md mb-4">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        
        <div>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              placeholder="Enter your password here"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="text-gray-400 w-5 h-5" />
              ) : (
                <Eye className="text-gray-400 w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        <div>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password here"
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-400"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="text-gray-400 w-5 h-5" />
              ) : (
                <Eye className="text-gray-400 w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-black text-white py-3 px-4 rounded-full font-medium hover:bg-gray-800 transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  )
}
export default ResetPasswordForm
