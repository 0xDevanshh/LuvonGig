"use client"
import React, { useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import {useParams} from 'next/navigation'
import { CheckCircle } from 'lucide-react'
export function VerificationComplete() {
  const navigate = useParams()
  useEffect(() => {
    // Redirect to profile page after 3 seconds
    const timer = setTimeout(() => {
      // navigate("/profile"); // Uncomment when profile page is created
      console.log('Redirecting to profile page...')
    }, 3000)
    return () => clearTimeout(timer)
  }, [navigate])
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
      <Header />
      <main className="flex-1 flex flex-col justify-center items-center py-8 px-4">
        <div className="max-w-md w-full mx-auto">
          <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-100 relative overflow-hidden">
            {/* Gradient background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 opacity-20 rounded-3xl"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-[#2ba24c]" />
              </div>
              <h1 className="text-center text-3xl font-bold text-[#161616] mb-4">
                Verification Complete
              </h1>
              <p className="text-center text-gray-600 mb-8 max-w-sm">
                Congratulations! You've successfully completed the verification
                process and are now officially a part of the Organaise community
                – where excellence meets opportunity.
              </p>
              <p className="text-[#2ba24c] font-medium">
                Redirecting to complete profile...
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
