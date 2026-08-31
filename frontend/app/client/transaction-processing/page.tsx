'use client'
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
export default function TransactionProcessing() {
  const navigate = useRouter();
  useEffect(() => {
    // Simulate processing time and then redirect
    const timer = setTimeout(() => {
      // Randomly decide between success and failure for demo purposes
      const isSuccess = Math.random() > 0.3;
      if (isSuccess) {
        navigate.push('/client/payment-success');
      } else {
        navigate.push('/client/payment-failed');
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);
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
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            Wait Please!!
          </h1>
          <p className="text-lg text-gray-600 mb-10">
            Your Transaction is going on please wait a while.
          </p>
          <div className="flex justify-center mb-10">
            <img src="/Organaise_Home_Page-1.png" alt="Processing Transaction" className="w-48 h-48 object-contain" />
          </div>
          <Progress value={50} className="h-2 max-w-md mx-auto" />
        </CardContent>
      </Card>
    </div>
  </div>;
}