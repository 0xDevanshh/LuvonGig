'use client'
import React, { useState } from 'react';
interface AddMemberFormProps {
  onSendInvite: () => void;
}
export function AddMemberForm({
  onSendInvite
}: AddMemberFormProps) {
  const [email, setEmail] = useState('');
  const [memberType, setMemberType] = useState('Member');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendInvite();
  };
  return <div className="p-6">
      <h2 className="text-2xl font-bold mb-2">Add new Member</h2>
      <p className="text-gray-600 mb-6">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
        tempor incididun.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label htmlFor="email" className="block text-sm uppercase text-gray-500 mb-2">
            ENTER EMAIL ID
          </label>
          <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter mail here" className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" required />
        </div>
        <div className="mb-8">
          <label htmlFor="memberType" className="block text-sm uppercase text-gray-500 mb-2">
            SELECT MEMBER TYPE
          </label>
          <div className="relative">
            <select id="memberType" value={memberType} onChange={e => setMemberType(e.target.value)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none">
              <option value="Member">Member</option>
              <option value="Admin">Admin</option>
              <option value="Moderator">Moderator</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <button type="submit" className="w-full py-4 bg-[#001F3F] text-white font-medium rounded-full hover:bg-[#00284d] transition-colors">
          Send Invite
        </button>
      </form>
    </div>;
}