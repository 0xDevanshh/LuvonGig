'use client'
import React from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Header1 } from '@/components/Header1'
import { Users, Briefcase, ArrowRight, Star } from 'lucide-react'

export default function ClientOrFreelancerPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header1 showSearch={false} />

      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-7xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Choose Your <span className="text-purple-600">Role</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Select how you'd like to use Workbudd today. You can switch between these roles anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Client Card */}
            <Link href="/client/dashboard" className="group">
              <Card className="h-full min-h-[380px] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-blue-500 cursor-pointer overflow-hidden rounded-3xl">
                <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                  <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                    <Users className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Client</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed flex-1">
                    Find and hire talented freelancers for your projects. Browse services, post jobs, and manage your projects.
                  </p>
                  <div className="flex items-center text-blue-600 font-bold group-hover:text-blue-700">
                    <span>Client Dashboard</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Freelancer Card */}
            <Link href="/freelancer/dashboard" className="group">
              <Card className="h-full min-h-[380px] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-green-500 cursor-pointer overflow-hidden rounded-3xl">
                <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                  <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-100 transition-colors">
                    <Briefcase className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Freelancer</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed flex-1">
                    Offer your services, manage your gigs, and grow your freelance business. Create services and connect with clients.
                  </p>
                  <div className="flex items-center text-green-600 font-bold group-hover:text-green-700">
                    <span>Freelancer Dashboard</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Expert Card */}
            <Link href="/expert/dashboard" className="group">
              <Card className="h-full min-h-[380px] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-purple-500 cursor-pointer overflow-hidden rounded-3xl">
                <CardContent className="h-full flex flex-col items-center justify-center p-8 text-center bg-white">
                  <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-100 transition-colors">
                    <Star className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Expert</h2>
                  <p className="text-gray-500 mb-8 leading-relaxed flex-1">
                    Offer 1:1 mentorship, share your professional knowledge, and earn ICP by helping others succeed.
                  </p>
                  <div className="flex items-center text-purple-600 font-bold group-hover:text-purple-700">
                    <span>Expert Dashboard</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="text-center mt-12 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-gray-100 max-w-md mx-auto">
            <p className="text-gray-400 text-sm italic">
              "Your journey on Workbudd depends on the value you bring."
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

