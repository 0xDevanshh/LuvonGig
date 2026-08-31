'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, MoreVertical } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';
export default function ProjectCompletionPage() {
  const navigate = useRouter();
  const handleRaiseDispute = () => {
    // Handle dispute logic
    console.log('Raising dispute');
  };
  const handleAskForReview = () => {
    navigate.push('/my-projects');
  };
  return <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      
      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        
        {/* Main Content */}
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4">
              <img src="https://via.placeholder.com/48" alt="Organaise Recruit" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Organaise Recruit</h2>
              <p className="text-sm text-gray-500">India - Fri 2023</p>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="p-2 rounded-full hover:bg-gray-100">
                <MessageSquare size={20} className="text-gray-500" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <MoreVertical size={20} className="text-gray-500" />
              </button>
            </div>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-4">
              I will do website ui, figma website design, website design figma,
              design website
            </h1>
            {/* Progress Tracker */}
            <div className="relative mb-8 mt-8">
              <div className="h-1 w-full bg-gray-200 rounded-full">
                <div className="h-1 bg-green-500 rounded-full w-full"></div>
              </div>
              <div className="flex justify-between mt-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1">Order Placed</span>
                  <span className="text-xs text-gray-500">10 minutes ago</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1">Order Placed</span>
                  <span className="text-xs text-gray-500">10 minutes ago</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1">Work completion</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1">Revision</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-xs mt-1">Project completion</span>
                </div>
              </div>
            </div>
            {/* Project Details Card */}
            <div className="border border-gray-200 rounded-lg p-8 mb-6 text-center">
              <h2 className="text-2xl font-bold text-green-500 mb-4">
                Project Completed Successfully!!
              </h2>
              <p className="text-gray-600 mb-8">
                Joining our network starts with an application. We meticulously
                review your expertise, portfolio, and professional background.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={handleRaiseDispute} className="px-8 py-3 border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors">
                  Raise A Dispute
                </button>
                <button onClick={handleAskForReview} className="px-8 py-3 bg-gradient-to-r from-blue-500 to-pink-500 text-white rounded-full font-medium hover:opacity-90 transition-opacity">
                  Ask For Review
                </button>
              </div>
            </div>
            {/* Recent Files Section */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-6">Recent Files</h3>
                <div className="flex flex-col items-center justify-center py-8">
                  <img src="/Freelancer_Payment_Flow2x-5.png" alt="No files" className="w-32 h-32 object-contain mb-4" />
                  <p className="text-gray-600">No Files Received till now</p>
                </div>
              </div>
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-bold mb-2">Order Details :</h3>
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden mr-3">
                    <img src="/Freelancer_Payment_Flow2x.png" alt="Basic Plan" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Basic Plan: <span className="text-green-500">$10</span>
                    </p>
                    <div className="flex items-center">
                      <span className="text-sm">In escrow</span>
                      <div className="w-2 h-2 bg-green-500 rounded-full ml-2"></div>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="mb-1">
                    Status :{' '}
                    <span className="text-yellow-500">Waiting for crispus</span>
                  </p>
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Submitted Requirements :
                </h3>
                <div className="text-gray-700">
                  <p className="font-medium mb-2">
                    How do I become a part of Organaise'd freelance network?
                  </p>
                  <p className="text-sm text-gray-600">
                    Joining our network starts with an application. We
                    meticulously review your expertise, portfolio, and
                    professional background.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}