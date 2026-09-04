'use client'
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
export default function PaymentSuccess() {
  const navigate = useRouter();
  useEffect(() => {
    // Auto-redirect to requirements page after 5 seconds
    const timer = setTimeout(() => {
      navigate.push('/client/projects');
    }, 5000);
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
      <Card className="max-w-2xl w-full border-green-100">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle size={80} className="text-green-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Payment Successfully Done!!
          </h1>
          <p className="text-gray-600 mb-8">
            Success! Your transaction has been processed. Welcome to the
            Organaise family, where your talents lead to great achievements.
            We're excited to see what you will accomplish!
          </p>
          <p className="text-green-600 mb-8">
            Redirecting to Requirements Page...
          </p>
          <Card className="bg-gray-50 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-600">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
              </div>
              <h3 className="font-medium mb-2">
                Organaise Payment Protection
              </h3>
              <p className="text-sm text-gray-600">
                Fund the project upfront. Cyrus gets paid once you are
                satisfied with the work.
              </p>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="outline" size="lg" onClick={() => navigate.push('/client/browse-services')} className="flex-1">
              Browse More Services
            </Button>
            <Button variant="default" size="lg" onClick={() => navigate.push('/client/projects')} className="flex-1 flex items-center justify-center">
              Submit Requirements
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>;
}