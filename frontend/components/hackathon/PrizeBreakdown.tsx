'use client'
import React from 'react';
interface Prize {
  name: string;
  amount: string;
}
interface PrizeBreakdownProps {
  prizes: Prize[];
  totalPrize: string;
}
export function PrizeBreakdown({
  prizes,
  totalPrize
}: PrizeBreakdownProps) {
  return <div className="mb-12">
      <h2 className="text-xl font-bold mb-6">Prize Breakdown</h2>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">{totalPrize}</h3>
          <span className="text-gray-500">Available in Prizes</span>
        </div>
        <button className="mt-2 text-sm text-blue-500 flex items-center">
          Detail Breakdown
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
            <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="space-y-4">
        {prizes.map((prize, index) => <div key={index} className="flex justify-between items-center">
            <div className="text-gray-700">{prize.name}</div>
            <div className="font-medium">{prize.amount}</div>
          </div>)}
      </div>
    </div>;
}