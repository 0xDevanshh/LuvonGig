'use client'
import React from 'react';
import { JobPostingFormData } from '../../../types/JobPostingFormData';
import { ChevronDown } from 'lucide-react';
interface ContractLocationStepProps {
  formData: JobPostingFormData;
  updateFormData: (data: Partial<JobPostingFormData>) => void;
}
export function ContractLocationStep({
  formData,
  updateFormData
}: ContractLocationStepProps) {
  return <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">
          Contract & Location Details
        </h2>
        <p className="text-gray-500 text-sm">
          Add at least 5 images. you can add more also.
        </p>
      </div>
      <div className="space-y-6">
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">JOB ROLE</label>
          <div className="relative">
            <select value={formData.jobRole} onChange={e => updateFormData({
            jobRole: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Internship">Internship</option>
              <option value="entry-level">Entry Level</option>
              <option value="mid-level">Mid Level</option>
              <option value="senior-level">Senior Level</option>
              <option value="management">Management</option>
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
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            DURATION OF CONTRACT
          </label>
          <div className="relative">
            <select value={formData.contractDuration} onChange={e => updateFormData({
            contractDuration: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="3 months">3 months</option>
              <option value="6 months">6 months</option>
              <option value="1 year">1 year</option>
              <option value="ongoing">Ongoing</option>
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
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            IS THIS A CONTRACT TO HIRE POSITION?
          </label>
          <div className="relative">
            <select value={formData.isContractToHire} onChange={e => updateFormData({
            isContractToHire: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="Yes">Yes</option>
              <option value="No">No</option>
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
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            WORKPLACE TYPE
          </label>
          <div className="relative">
            <select value={formData.workplaceType} onChange={e => updateFormData({
            workplaceType: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Workplace Type</option>
              <option value="onsite">Onsite</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="relative">
          <label className="block text-xs text-gray-500 mb-1">
            ENTER LOCATION DETAILS
          </label>
          <div className="relative">
            <input type="text" placeholder="ENTER YOUR ADDRESS HERE" value={formData.location} onChange={e => updateFormData({
            location: e.target.value
          })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs hover:text-blue-500">
              Ask AI
            </button>
          </div>
          <div className="mt-2 bg-gray-100 rounded-lg h-36 overflow-hidden">
            <img src="https://miro.medium.com/v2/resize:fit:1400/1*qYUvh-EtES8dtgKiBRiLsA.png" alt="Map" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>;
}