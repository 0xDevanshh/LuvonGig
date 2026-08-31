'use client';

import React, { Suspense } from 'react';
import { HackathonForm } from '@/components/hackathons/HackathonForm';
import { useSearchParams } from 'next/navigation';

const CreateHackathonContent = () => {
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit') || undefined;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-6xl mx-auto py-10 px-4 md:px-8 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            {editId ? 'Edit Hackathon' : 'Create a Hackathon'}
          </h1>
          <p className="text-gray-600">
            {editId 
              ? 'Update your hackathon details and save changes to the ICP testnet canister.'
              : 'Fill out the required details and publish directly to the ICP testnet canister.'
            }
          </p>
        </header>

        <HackathonForm initialHackathonId={editId} />
      </div>
    </div>
  );
};

const CreateHackathonPage = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <CreateHackathonContent />
    </Suspense>
  );
};

export default CreateHackathonPage;