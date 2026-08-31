'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { HackathonForm } from '@/components/hackathons/HackathonForm';

export default function EditHackathonPage() {
  const params = useParams();
  const hackathonId = params?.hackathonId as string;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <Link
              href="/client/hackathons"
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to My Hackathons
            </Link>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-900">Edit Hackathon</h1>
            <p className="mt-2 text-gray-600">
              Update the details and settings for your hackathon event.
            </p>
          </div>
        </div>

        {/* Hackathon Form */}
        <HackathonForm initialHackathonId={hackathonId} />
      </div>
    </div>
  );
}