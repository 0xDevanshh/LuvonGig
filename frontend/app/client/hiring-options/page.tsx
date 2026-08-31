'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
export default function HiringOptionsPage() {
  const navigate = useRouter();
  const handleBuyService = () => {
    navigate.push('/hire-talent'); // Navigate to existing hire talent page
  };
  const handlePostJob = () => {
    navigate.push('/client/job-posting-overview');
  };
  return <div className="min-h-screen bg-white flex flex-col">
    {/* Header */}
    <header className="border-b border-gray-200 py-4 px-6">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center">
          <svg width="110" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8">
            <path d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z" fill="#FF3B30" />
            <path d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z" fill="#34C759" />
            <path d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z" fill="#007AFF" />
          </svg>
          <span className="ml-2 font-bold text-xl">Workbudd</span>
        </div>
        <button onClick={() => navigate.push('/profile/dashboard')} className="px-8 py-2 rounded-full border border-gray-300 text-gray-800 hover:bg-gray-50">
          Exit
        </button>
      </div>
    </header>
    <div className="flex-1 flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-16">
        Whom Are You Hiring?
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full">
        {/* Freelancer Option */}
        <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center">
          <div className="mb-6">
            <img src="https://cdn-icons-png.flaticon.com/512/2593/2593073.png" alt="Freelancer" className="w-32 h-32 object-contain" />
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">
            Freelancer for a service
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Hire a freelancer for a specific project or service
          </p>
          <button onClick={handleBuyService} className="w-full py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors">
            Buy A service
          </button>
        </div>
        {/* Full Time Option */}
        <div className="border border-gray-200 rounded-lg p-8 flex flex-col items-center">
          <div className="mb-6">
            <img src="https://cdn-icons-png.flaticon.com/512/3281/3281289.png" alt="Full Time" className="w-32 h-32 object-contain" />
          </div>
          <h2 className="text-xl font-semibold text-center mb-2">
            Full Time/ Direct Hire Addition to your team
          </h2>
          <p className="text-gray-500 text-center mb-8">
            Hire a full-time employee for your team
          </p>
          <button onClick={handlePostJob} className="w-full py-3 bg-black text-white rounded-md hover:bg-gray-800 transition-colors">
            Post A Job
          </button>
        </div>
      </div>
    </div>
  </div>;
}