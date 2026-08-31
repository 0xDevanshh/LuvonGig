'use client'
import React from 'react';
import { JobPostingFormData } from '../../../types/JobPostingFormData';
import { ChevronDown } from 'lucide-react';
interface OverviewStepProps {
  formData: JobPostingFormData;
  updateFormData: (data: Partial<JobPostingFormData>) => void;
}
export function OverviewStep({
  formData,
  updateFormData
}: OverviewStepProps) {
  return <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Overview About The Job</h2>
        <p className="text-gray-500 text-sm">
          Add at least 5 images. you can add more also.
        </p>
      </div>
      <div className="space-y-6">
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            WHAT TYPE OF JOB IS IT?
          </label>
          <div className="relative">
            <div className="relative">
              <select value={formData.jobType} onChange={e => updateFormData({
              jobType: e.target.value
            })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Full time or Direct Hire">
                  Full time or Direct Hire
                </option>
                <option value="Part time">Part time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <div className="flex items-center pr-4">
                  <button className="text-gray-400 text-xs hover:text-blue-500">
                    Ask AI
                  </button>
                  <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">CATEGORY</label>
          <div className="relative">
            <div className="relative">
              <select value={formData.category} onChange={e => updateFormData({
              category: e.target.value
            })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Category</option>
                <option value="web-development">Web Development</option>
                <option value="mobile-development">Mobile Development</option>
                <option value="ui-ux-design">UI/UX Design</option>
                <option value="blockchain">Blockchain</option>
                <option value="data-science">Data Science</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <div className="flex items-center pr-4">
                  <button className="text-gray-400 text-xs hover:text-blue-500">
                    Ask AI
                  </button>
                  <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            SUB-CATEGORY
          </label>
          <div className="relative">
            <div className="relative">
              <select value={formData.subCategory} onChange={e => updateFormData({
              subCategory: e.target.value
            })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sub-Category</option>
                <option value="frontend">Frontend Development</option>
                <option value="backend">Backend Development</option>
                <option value="fullstack">Full Stack Development</option>
                <option value="ui-design">UI Design</option>
                <option value="ux-design">UX Design</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center">
                <div className="flex items-center pr-4">
                  <button className="text-gray-400 text-xs hover:text-blue-500">
                    Ask AI
                  </button>
                  <ChevronDown className="ml-2 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}