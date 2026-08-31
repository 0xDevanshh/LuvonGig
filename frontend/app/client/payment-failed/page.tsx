'use client'
import React from 'react';
import { useRouter } from 'next/navigation';
import { XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
export default function PaymentFailed() {
  const navigate = useRouter();
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
      </div>
    </header>
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <Card className="max-w-lg w-full border-red-100">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <XCircle size={80} className="text-red-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 text-red-500">
            Payment Failed!!
          </h1>
          <p className="text-gray-600 mb-8">
            We're sorry, but your payment could not be processed at this time.
            Please check your payment details and try again.
          </p>
          <div className="mb-8 flex justify-center flex-col items-center">
            <img src="/Organaise_Home_Page-3.png" alt="Payment Error" className="w-48 h-48 object-contain" />
            <div className="text-sm text-gray-500 mt-2">
              Service unavailable
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="secondary" size="lg" onClick={() => navigate.push('/client/checkout/1')} className="flex-1">
              GO Payment Page
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate.push('/client/browse-services')} className="flex-1">
              GO back Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
}