import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FreelancerProfileLayout } from '@/components/FreelancerProfileLayout';
import { Plus } from 'lucide-react';
export function ProfileEducationList() {
  const navigate = useRouter();
  const [educations, setEducations] = useState([{
    id: '1',
    school: 'Delhi University',
    degree: 'BA Hons Design',
    startDate: 'June 2022',
    endDate: 'July 2023'
  }]);
  const handleAddMoreEducation = () => {
    // Navigate to add education form
    navigate.push('/profile/education');
  };
  const handleContinue = () => {
    // Save data and navigate to next section
    navigate.push('/profile/work');
  };
  return <FreelancerProfileLayout activeTab="education" progress="1/3" detailsType="About">
      <div>
        <h2 className="text-xl font-semibold text-[#161616] mb-6">
          Education Requirements
        </h2>
        <div className="space-y-6">
          {educations.map(education => <div key={education.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex-shrink-0 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 10V15C22 16.1046 21.1046 17 20 17H4C2.89543 17 2 16.1046 2 15V8C2 6.89543 2.89543 6 4 6H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 15L16 9L20 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 21H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3L18 5L22 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{education.school}</h3>
                <p className="text-[#2ba24c]">{education.degree}</p>
                <p className="text-sm text-gray-500">
                  {education.startDate} - {education.endDate}
                </p>
              </div>
            </div>)}
          <button onClick={handleAddMoreEducation} className="flex items-center gap-2 text-blue-600 mt-4">
            <Plus size={16} className="text-blue-600" />
            ADD MORE EDUCATION
          </button>
        </div>
        <div className="flex justify-center pt-10">
          <button onClick={handleContinue} className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Next
          </button>
        </div>
      </div>
    </FreelancerProfileLayout>;
}