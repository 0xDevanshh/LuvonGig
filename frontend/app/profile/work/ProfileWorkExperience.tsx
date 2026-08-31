"use client"
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FreelancerProfileLayout } from '@/components/FreelancerProfileLayout';
import { ChevronDown } from 'lucide-react';
export function ProfileWorkExperience() {
  const navigate = useRouter();
  const searchParams = useSearchParams();
  const experienceId = searchParams.get('id');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const roles = ['UI/UX Designer', 'Web Designer', 'Graphic Designer', 'Product Designer', 'Frontend Developer', 'Full Stack Developer'];
  // If editing an existing experience
  useEffect(() => {
    if (experienceId) {
      // In a real app, you would fetch the experience data from an API or context
      // For now, we'll just set some dummy data
      setCompany('Levitating Elephant Technologies Pvt Ltd');
      setRole('Frontend Web Developer');
      setStartDate('June 2022');
      setEndDate('July 2023');
      setDescription('Developed responsive web applications using React and TypeScript.');
      setCharCount('Developed responsive web applications using React and TypeScript.'.length);
    }
  }, [experienceId]);
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDescription(text);
    setCharCount(text.length);
  };
  const handleRoleSelect = (selectedRole: string) => {
    setRole(selectedRole);
    setShowRoleDropdown(false);
  };
  const handleContinue = () => {
    // Save data and navigate to work list
    navigate.push('/profile/work-experience-list');
  };
  return <FreelancerProfileLayout activeTab="work" progress="1/3" detailsType="Work">
      <div>
        <h2 className="text-xl font-semibold text-[#161616] mb-6">
          Work Experience Requirements
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-2">
              ADD YOUR PREVIOUS COMPANY
            </label>
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c]" placeholder="Enter The Name" />
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-2">
              SELECT YOUR ROLE
            </label>
            <div className="relative">
              <button type="button" onClick={() => setShowRoleDropdown(!showRoleDropdown)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c] flex justify-between items-center">
                <span className={role ? 'text-black' : 'text-gray-400'}>
                  {role || 'Select Degree'}
                </span>
                <ChevronDown size={20} className="text-gray-400" />
              </button>
              {showRoleDropdown && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {roles.map(r => <button key={r} className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => handleRoleSelect(r)}>
                      {r}
                    </button>)}
                </div>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">
                STARTING YEAR
              </label>
              <input type="text" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c]" placeholder="Select the date" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">
                ENDING YEAR
              </label>
              <input type="text" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c]" placeholder="Select the date" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-2">
              ABOUT DESCRIPTION (OPTIONAL)
            </label>
            <div className="border border-gray-200 rounded-lg p-4">
              <textarea value={description} onChange={handleDescriptionChange} className="w-full min-h-[100px] outline-none resize-none" placeholder="Add Your Description" />
              <div className="flex justify-end text-xs text-gray-500">
                {charCount}/240
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-10">
          <button onClick={handleContinue} className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Next
          </button>
        </div>
      </div>
    </FreelancerProfileLayout>;
}