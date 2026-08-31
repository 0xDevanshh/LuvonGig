'use client'
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
interface ServiceFilterProps {
  filters: {
    topRated: boolean;
    bestSeller: boolean;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    topRated: boolean;
    bestSeller: boolean;
  }>>;
}
export function ServiceFilter({
  filters,
  setFilters
}: ServiceFilterProps) {
  const [isSellerOpen, setIsSellerOpen] = useState(false);
  const [isRatingsOpen, setIsRatingsOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  return <div className="flex flex-wrap items-center justify-between mt-6">
      <div className="flex items-center space-x-2 mb-4 md:mb-0">
        <span className="text-gray-700">Filter :</span>
        <div className="relative">
          <button className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg" onClick={() => setIsSellerOpen(!isSellerOpen)}>
            <span>Seller Details</span>
            <ChevronDown size={16} />
          </button>
          {isSellerOpen && <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Top Sellers</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>New Sellers</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>Local Sellers</span>
                </label>
              </div>
            </div>}
        </div>
        <div className="relative">
          <button className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg" onClick={() => setIsRatingsOpen(!isRatingsOpen)}>
            <span>Ratings</span>
            <ChevronDown size={16} />
          </button>
          {isRatingsOpen && <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>★★★★★ (5.0)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>★★★★☆ (4.0 & up)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" className="rounded" />
                  <span>★★★☆☆ (3.0 & up)</span>
                </label>
              </div>
            </div>}
        </div>
        <div className="relative">
          <button className="flex items-center space-x-1 px-4 py-2 border border-gray-300 rounded-lg" onClick={() => setIsBudgetOpen(!isBudgetOpen)}>
            <span>Budget</span>
            <ChevronDown size={16} />
          </button>
          {isBudgetOpen && <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Price Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <input type="text" placeholder="Min" className="w-full border border-gray-300 rounded px-2 py-1" />
                    <span>-</span>
                    <input type="text" placeholder="Max" className="w-full border border-gray-300 rounded px-2 py-1" />
                  </div>
                </div>
                <button className="w-full bg-blue-600 text-white py-2 rounded-lg">
                  Apply
                </button>
              </div>
            </div>}
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="rounded" checked={filters.topRated} onChange={() => setFilters(prev => ({
          ...prev,
          topRated: !prev.topRated
        }))} />
          <span>Top Rated</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" className="rounded" checked={filters.bestSeller} onChange={() => setFilters(prev => ({
          ...prev,
          bestSeller: !prev.bestSeller
        }))} />
          <span>Best Seller</span>
        </label>
      </div>
    </div>;
}