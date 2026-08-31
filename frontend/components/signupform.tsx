'use client'
import React, { useState } from 'react'
import { Eye, EyeOff, Mail } from 'lucide-react'
export function SignUpForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Form submission logic would go here
    console.log('Form submitted', {
      email,
      password,
      confirmPassword,
    })
  }
  return (
    <div className="max-w-md w-full mx-auto px-4">
      <h1 className="text-center text-3xl font-bold text-[#161616] mb-8">
        Sign Up Here to
        <br />
        create new account
      </h1>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="email"
              placeholder="Enter your email id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-3 px-12 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#7d7d7d]"
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password here"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#7d7d7d]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>
        <div className="mb-6">
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm your password here"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#7d7d7d]"
              required
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
          className="w-full bg-[#000000] text-white py-3 rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors"
        >
          Create Account
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
      <div className="mt-6">
        <button
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-[#161616] py-3 px-4 rounded-full shadow-sm hover:shadow-md transition-shadow"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M18.1711 8.36788H17.4998V8.33329H9.99984V11.6666H14.7094C14.0223 13.607 12.1761 14.9999 9.99984 14.9999C7.23859 14.9999 4.99984 12.7612 4.99984 9.99996C4.99984 7.23871 7.23859 4.99996 9.99984 4.99996C11.2744 4.99996 12.4344 5.48079 13.3169 6.26621L15.6744 3.90871C14.1886 2.52204 12.1969 1.66663 9.99984 1.66663C5.39775 1.66663 1.6665 5.39788 1.6665 9.99996C1.6665 14.602 5.39775 18.3333 9.99984 18.3333C14.6019 18.3333 18.3332 14.602 18.3332 9.99996C18.3332 9.44121 18.2757 8.89579 18.1711 8.36788Z"
              fill="#FFC107"
            />
            <path
              d="M2.62744 6.12121L5.36536 8.12913C6.10619 6.29496 7.90036 4.99996 9.99994 4.99996C11.2745 4.99996 12.4345 5.48079 13.317 6.26621L15.6745 3.90871C14.1887 2.52204 12.197 1.66663 9.99994 1.66663C6.74869 1.66663 3.91036 3.47371 2.62744 6.12121Z"
              fill="#FF3D00"
            />
            <path
              d="M10.0001 18.3333C12.1417 18.3333 14.0892 17.5166 15.5684 16.1999L13.0109 13.9874C12.1517 14.6441 11.1092 14.9999 10.0001 14.9999C7.83508 14.9999 5.99591 13.6208 5.30258 11.6941L2.58008 13.8074C3.84841 16.4116 6.70925 18.3333 10.0001 18.3333Z"
              fill="#4CAF50"
            />
            <path
              d="M18.1711 8.36796H17.4998V8.33337H9.99984V11.6667H14.7094C14.3848 12.5902 13.7897 13.3863 13.0095 13.9879L13.0109 13.987L15.5684 16.1995C15.4059 16.3479 18.3332 14.1667 18.3332 10C18.3332 9.44129 18.2757 8.89587 18.1711 8.36796Z"
              fill="#1976D2"
            />
          </svg>
          Sign Up with Google
        </button>
      </div>
    </div>
  )
}
