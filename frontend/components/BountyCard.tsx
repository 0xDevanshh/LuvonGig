import React from 'react'
export function BountyCard() {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold">Web3 Security Challenge</h3>
            <p className="text-sm text-gray-600">Security First</p>
          </div>
          <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
            Open
          </span>
        </div>
        <div className="text-xs text-gray-500 mb-4">Mode: Virtual</div>
        <div className="flex gap-2 mb-4">
          <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
            Smart
          </span>
          <span className="px-3 py-1 text-xs bg-pink-100 text-pink-700 rounded-full">
            Contracts
          </span>
        </div>
        <div className="space-y-2 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Prize Pool</span>
            <span className="text-green-600 font-medium">$75,000</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Timeline</span>
            <span>537 days</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Participants</span>
            <span>Register Now</span>
          </div>
        </div>
        <button className="w-full py-3 text-center text-purple-600 font-medium border border-gray-200 rounded-lg hover:bg-gray-50">
          Register Now
        </button>
      </div>
    </div>
  )
}
