'use client'
import React from 'react';
interface InviteSentConfirmationProps {
  onGoBack: () => void;
}
export function InviteSentConfirmation({
  onGoBack
}: InviteSentConfirmationProps) {
  return <div className="p-6 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-2">Invite sent Successfully</h2>
      <p className="text-gray-600 mb-8 text-center">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididun.
      </p>
      <div className="w-64 h-64 mb-8">
        <img src="https://cdn.pixabay.com/photo/2016/01/10/22/23/location-1132648_960_720.png" alt="Invite Sent" className="w-full h-full object-contain" />
      </div>
      <button onClick={onGoBack} className="px-12 py-4 bg-[#001F3F] text-white font-medium rounded-full hover:bg-[#00284d] transition-colors">
        Go Back
      </button>
    </div>;
}