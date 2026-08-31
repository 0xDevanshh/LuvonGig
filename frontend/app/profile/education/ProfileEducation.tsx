"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FreelancerProfileLayout } from '@/components/FreelancerProfileLayout';
import { Check, ChevronDown } from 'lucide-react';
export function ProfileEducation() {
  const navigate = useRouter();
  const [school, setSchool] = useState('');
  const [degree, setDegree] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [showDegreeDropdown, setShowDegreeDropdown] = useState(false);
  const [showStartYearDropdown, setShowStartYearDropdown] = useState(false);
  const [showEndYearDropdown, setShowEndYearDropdown] = useState(false);
  const degrees = ['Bachelor of Arts (BA)', 'Bachelor of Science (BSc)', 'Bachelor of Design (BDes)', 'Master of Arts (MA)', 'Master of Science (MSc)', 'Master of Design (MDes)', 'PhD'];
  const years = Array.from({
    length: 30
  }, (_, i) => (new Date().getFullYear() - i).toString());
  const handleSchoolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchool(e.target.value);
    setIsSaved(true);
    // Auto-hide the saved indicator after 2 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };
  const handleDegreeSelect = (selectedDegree: string) => {
    setDegree(selectedDegree);
    setShowDegreeDropdown(false);
  };
  const handleStartYearSelect = (selectedYear: string) => {
    setStartYear(selectedYear);
    setShowStartYearDropdown(false);
  };
  const handleEndYearSelect = (selectedYear: string) => {
    setEndYear(selectedYear);
    setShowEndYearDropdown(false);
  };
  const handleContinue = () => {
    // Save data and navigate to education list or next section
    navigate.push('/profile/education-list');
  };
  return <FreelancerProfileLayout activeTab="education" progress="1/3" detailsType="About">
      <div>
        <h2 className="text-xl font-semibold text-[#161616] mb-6">
          Education Requirements
        </h2>
        <div className="space-y-6">
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-2">
              SCHOOL*
            </label>
            <div className="relative">
              <input type="text" value={school} onChange={handleSchoolChange} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c]" placeholder="Delhi University" />
              {isSaved && <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-1">
                    <Check size={12} />
                  </div>
                  <span className="text-sm">Saved</span>
                </div>}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-2">
              DEGREE
            </label>
            <div className="relative">
              <button type="button" onClick={() => setShowDegreeDropdown(!showDegreeDropdown)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c] flex justify-between items-center">
                <span className={degree ? 'text-black' : 'text-gray-400'}>
                  {degree || 'Select Degree'}
                </span>
                <ChevronDown size={20} className="text-gray-400" />
              </button>
              {showDegreeDropdown && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {degrees.map(d => <button key={d} className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => handleDegreeSelect(d)}>
                      {d}
                    </button>)}
                </div>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">
                STARTING YEAR
              </label>
              <div className="relative">
                <button type="button" onClick={() => setShowStartYearDropdown(!showStartYearDropdown)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c] flex justify-between items-center">
                  <span className={startYear ? 'text-black' : 'text-gray-400'}>
                    {startYear || 'Select Year'}
                  </span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
                {showStartYearDropdown && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {years.map(year => <button key={year} className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => handleStartYearSelect(year)}>
                        {year}
                      </button>)}
                  </div>}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 uppercase mb-2">
                ENDING YEAR
              </label>
              <div className="relative">
                <button type="button" onClick={() => setShowEndYearDropdown(!showEndYearDropdown)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c] flex justify-between items-center">
                  <span className={endYear ? 'text-black' : 'text-gray-400'}>
                    {endYear || 'Select Year'}
                  </span>
                  <ChevronDown size={20} className="text-gray-400" />
                </button>
                {showEndYearDropdown && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {years.map(year => <button key={year} className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => handleEndYearSelect(year)}>
                        {year}
                      </button>)}
                  </div>}
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