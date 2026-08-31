'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ServiceNavigation } from '@/components/ServiceNavigation';
import { ServiceTierCard } from '@/components/ServiceTierCard';
import { useServiceForm } from '@/context/ServiceFormContext';
import Image from 'next/image';
export default function AddServiceProjects() {
  const navigate = useRouter();
  const {
    formData,
    updateFormData
  } = useServiceForm();
  const handleTierModeToggle = () => {
    updateFormData({
      tierMode: formData.tierMode === '1tier' ? '3tier' : '1tier'
    });
  };
  const handleContinue = () => {
    navigate.push('/add-service/pricing');
  };
  return <div className="flex flex-col min-h-screen bg-white">
    <header className="flex justify-between items-center p-4 border-b border-gray-200">
      <img src="/WB.png" alt="Workbudd Logo" className="h-6" />

      <button className="px-8 py-2 rounded-full border border-gray-300 text-gray-800 hover:bg-gray-50">
        Exit
      </button>
    </header>
    <main className="flex-1 container mx-auto py-6 px-4 max-w-5xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#161616]">
          Add Your Services
        </h1>
        <div className="text-sm text-gray-600">
          Projects Details: <span className="font-medium">1/5 Done</span>
        </div>
      </div>
      <ServiceNavigation activeTab="projects" />
      <div className="mt-12">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#161616]">
              Project Requirements
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Add your questions and requirements here.
            </p>
          </div>
          <div className="flex items-center">
            <span className="mr-2 text-sm">1 Tier</span>
            <div className="w-12 h-6 rounded-full bg-gray-200 flex items-center p-1 cursor-pointer" onClick={handleTierModeToggle}>
              <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${formData.tierMode === '3tier' ? 'bg-green-500 transform translate-x-6' : 'bg-gray-400'}`}></div>
            </div>
            <span className="ml-2 text-sm">3 Tiers</span>
          </div>
        </div>
        {formData.tierMode === '1tier' ? <div className="max-w-md mx-auto">
          <ServiceTierCard title="Basic" color="bg-[#FFF8D6]" tier="basic" />
        </div> : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ServiceTierCard title="Basic" color="bg-[#FFF8D6]" tier="basic" />
          <ServiceTierCard title="Advanced" color="bg-[#DFFCE9]" tier="advanced" />
          <ServiceTierCard title="Premium" color="bg-[#E9D8FF]" tier="premium" />
        </div>}
        <div className="mt-12 flex justify-center">
          <button onClick={handleContinue} className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Continue
          </button>
        </div>
      </div>
    </main>
  </div>;
}