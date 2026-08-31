'use client'
import React from 'react';
import { JobPostingFormData } from '../../../types/JobPostingFormData';
import { ChevronDown } from 'lucide-react';
interface JobDetailsStepProps {
  formData: JobPostingFormData;
  updateFormData: (data: Partial<JobPostingFormData>) => void;
}
export function JobDetailsStep({
  formData,
  updateFormData
}: JobDetailsStepProps) {
  return <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Job Details</h2>
        <p className="text-gray-500 text-sm">
          Add at least 5 images. you can add more also.
        </p>
      </div>
      <div className="space-y-6">
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">JOB TITLE</label>
          <div className="relative">
            <input type="text" placeholder="Enter Job Title" value={formData.jobTitle} onChange={e => updateFormData({
            jobTitle: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs hover:text-blue-500">
              Ask AI
            </button>
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            ROLES & RESPONSIBILITES
          </label>
          <div className="relative">
            <textarea placeholder="Enter Roles & Responsibilites" value={formData.rolesResponsibilities} onChange={e => updateFormData({
            rolesResponsibilities: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" />
            <button className="absolute right-4 top-6 text-gray-400 text-xs hover:text-blue-500">
              Ask AI
            </button>
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            SKILLS REQUIRED
          </label>
          <div className="relative">
            <select value={formData.skillsRequired} onChange={e => updateFormData({
            skillsRequired: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Skills</option>
              <option value="web-development">Web Development</option>
              <option value="mobile-development">Mobile Development</option>
              <option value="ui-ux-design">UI/UX Design</option>
              <option value="blockchain">Blockchain</option>
              <option value="data-science">Data Science</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">BENEFITS</label>
          <div className="relative">
            <select value={formData.benefits} onChange={e => updateFormData({
            benefits: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Benefits</option>
              <option value="healthcare">Healthcare</option>
              <option value="remote-work">Remote Work</option>
              <option value="flexible-hours">Flexible Hours</option>
              <option value="paid-time-off">Paid Time Off</option>
              <option value="professional-development">
                Professional Development
              </option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
    </div>;
}