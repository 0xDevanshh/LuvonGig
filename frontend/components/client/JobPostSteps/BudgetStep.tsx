'use client'
import React from 'react';
import { JobPostingFormData } from '../../../types/JobPostingFormData';
import { ChevronDown } from 'lucide-react';
interface BudgetStepProps {
  formData: JobPostingFormData;
  updateFormData: (data: Partial<JobPostingFormData>) => void;
}
export function BudgetStep({
  formData,
  updateFormData
}: BudgetStepProps) {
  return <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Budget Details</h2>
        <p className="text-gray-500 text-sm">
          Add at least 5 images. you can add more also.
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">
              ENTER YOUR BUDGET AMOUNT TO PAY
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input type="text" placeholder="24" value={formData.budget} onChange={e => updateFormData({
              budget: e.target.value
            })} className="w-full py-3 pl-8 pr-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">
              SELECT THE TIME PERIOD FOR PAYMENT
            </label>
            <div className="relative">
              <select value={formData.paymentPeriod} onChange={e => updateFormData({
              paymentPeriod: e.target.value
            })} className="w-full py-3 px-4 border border-gray-300 rounded-lg shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="Per Hour">Per Hour</option>
                <option value="Per Day">Per Day</option>
                <option value="Per Week">Per Week</option>
                <option value="Per Month">Per Month</option>
                <option value="Fixed Price">Fixed Price</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">
              ENTER YOUR MINIMUM AMOUNT TO PAY
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input type="text" placeholder="24" value={formData.minBudget} onChange={e => updateFormData({
              minBudget: e.target.value
            })} className="w-full py-3 pl-8 pr-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="relative">
            <label className="block text-xs text-gray-500 mb-1">
              ENTER YOUR MAXIMUM AMOUNT TO PAY
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <input type="text" placeholder="24" value={formData.maxBudget} onChange={e => updateFormData({
              maxBudget: e.target.value
            })} className="w-full py-3 pl-8 pr-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="unpaid-internship" checked={formData.isUnpaidInternship} onChange={e => updateFormData({
          isUnpaidInternship: e.target.checked,
          isVolunteering: e.target.checked ? false : formData.isVolunteering
        })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
          <label htmlFor="unpaid-internship" className="ml-2 block text-sm text-gray-700">
            MARK AS UNPAID INTERNSHIP
          </label>
        </div>
        <div className="flex items-center">
          <input type="checkbox" id="volunteering" checked={formData.isVolunteering} onChange={e => updateFormData({
          isVolunteering: e.target.checked,
          isUnpaidInternship: e.target.checked ? false : formData.isUnpaidInternship
        })} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
          <label htmlFor="volunteering" className="ml-2 block text-sm text-gray-700">
            MARK AS UNPAID VOLUNTEERING
          </label>
        </div>
      </div>
    </div>;
}