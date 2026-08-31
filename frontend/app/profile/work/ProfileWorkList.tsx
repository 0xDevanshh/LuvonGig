"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FreelancerProfileLayout } from '@/components/FreelancerProfileLayout';
import { Plus, Edit2 } from 'lucide-react';

export function ProfileWorkList() {
  const navigate = useRouter();
  const [workExperiences, setWorkExperiences] = useState([{
    id: '1',
    role: 'Frontend Web Developer',
    company: 'Levitating Elephant Technologies Pvt Ltd',
    startDate: 'June 2022',
    endDate: 'July 2023',
    description: 'Developed responsive web applications using React and TypeScript.'
  }]);

  const addWorkExperience = () => {
    const newExperience = {
      id: Date.now().toString(),
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    setWorkExperiences([...workExperiences, newExperience]);
  };

  const updateWorkExperience = (id: string, field: string, value: string) => {
    setWorkExperiences(workExperiences.map(exp => 
      exp.id === id ? { ...exp, [field]: value } : exp
    ));
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter(exp => exp.id !== id));
  };

  return (
    <FreelancerProfileLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
          <button
            onClick={addWorkExperience}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Experience
          </button>
        </div>

        <div className="space-y-4">
          {workExperiences.map((experience) => (
            <div key={experience.id} className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                <div className="flex gap-2">
                  <button className="p-2 text-gray-500 hover:text-gray-700">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => removeWorkExperience(experience.id)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input
                    type="text"
                    value={experience.role}
                    onChange={(e) => updateWorkExperience(experience.id, 'role', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Frontend Developer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={experience.company}
                    onChange={(e) => updateWorkExperience(experience.id, 'company', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Tech Corp"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={experience.startDate}
                    onChange={(e) => updateWorkExperience(experience.id, 'startDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., June 2022"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="text"
                    value={experience.endDate}
                    onChange={(e) => updateWorkExperience(experience.id, 'endDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., July 2023 or Present"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={experience.description}
                  onChange={(e) => updateWorkExperience(experience.id, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Describe your role and achievements..."
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => navigate.push('/profile')}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </FreelancerProfileLayout>
  );
}