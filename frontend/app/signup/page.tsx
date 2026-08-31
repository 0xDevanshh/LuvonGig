'use client';
import React from 'react'
import Header from '../../components/auth/Header'
import SignupForm from '@/components/auth1/SignupForm'
import { useRouter } from 'next/navigation'
const SignUp = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header />
      <div className="flex-1 flex items-center justify-center py-12">
        <SignupForm />
      </div>
    </div>
  )
}
export default SignUp
