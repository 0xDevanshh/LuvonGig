'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
export default function CheckoutSuccess() {
  const navigate = useRouter();
  return <div className="min-h-screen bg-gray-50 flex flex-col">
    {/* Header */}
    <header className="bg-white border-b border-gray-200 py-4 px-4">
      <div className="container mx-auto flex items-center">
        <svg width="40" height="32" viewBox="0 0 40 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
          <path d="M20.0001 0L0 11.5556V23.1111L20.0001 11.5556L40.0001 23.1111V11.5556L20.0001 0Z" fill="#FF3B30" />
          <path d="M0 23.1111L20.0001 11.5555V23.1111V34.6667L0 23.1111Z" fill="#34C759" />
          <path d="M40.0001 23.1111L20.0001 11.5555V23.1111V34.6667L40.0001 23.1111Z" fill="#007AFF" />
        </svg>
        <span className="font-bold text-xl">Workbudd</span>
      </div>
    </header>
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="flex justify-center mb-6">
          <CheckCircle size={80} className="text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-8">
          Thank you for your purchase. Your order has been successfully
          processed. The freelancer has been notified and will begin working
          on your project.
        </p>
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="font-semibold mb-4">Order Details</h2>
          <div className="space-y-3 text-left">
            <div className="flex justify-between">
              <span className="text-gray-600">Order ID</span>
              <span className="font-medium">#ORD-2023-1234</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-medium">$110.00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span>Credit Card (**** 1234)</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={() => navigate.push('/client/browse-services')} className="flex-1 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Browse More Services
          </button>
          <button onClick={() => navigate.push('/client/projects')} className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
            Submit Requirements
            <ArrowRight size={18} className="ml-2" />
          </button>
        </div>
      </div>
    </div>
  </div>;
}