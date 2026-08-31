'use client'
import React from 'react'

import { BountyCard } from '@/components/BountyCard'
import { FilterSidebar } from '@/components/FilterSidebar'
export default function Bounties() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
      
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Bounties</h1>
              <p className="text-gray-600">
                Discover Bounties and earn rewards
              </p>
            </div>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1">
                {/* Categories */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <button className="px-6 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50">
                    All Categories
                  </button>
                  <button className="px-6 py-2 rounded-full bg-orange-500 text-white">
                    Smart Contracts
                  </button>
                  <button className="px-6 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Frontend
                  </button>
                  <button className="px-6 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Backend
                  </button>
                  <button className="px-6 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50">
                    Documentation
                  </button>
                  <button className="px-6 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50">
                    User Testing
                  </button>
                </div>
                {/* Bounty Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((id) => (
                    <BountyCard key={id} />
                  ))}
                </div>
              </div>
              {/* Filter Sidebar */}
              <FilterSidebar />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
