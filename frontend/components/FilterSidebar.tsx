'use client'
import React, { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'

export function FilterSidebar() {
  const [jobTypes, setJobTypes] = useState({
    fulltime: false,
    parttime: false,
    internship: false,
    contract: false,
    cofounder: false,
  })

  const [jobRoles, setJobRoles] = useState({
    programming: true, // Default checked
    design: false,
    management: false,
    support: false,
    sales: false,
  })

  const [salaryRanges, setSalaryRanges] = useState({
    range1: false,
    range2: false,
    range3: false,
  })

  const [remoteOnly, setRemoteOnly] = useState(false)
  const [location, setLocation] = useState('Anywhere')

  const handleJobTypeChange = (key: keyof typeof jobTypes) => {
    setJobTypes((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleJobRoleChange = (key: keyof typeof jobRoles) => {
    setJobRoles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSalaryRangeChange = (key: keyof typeof salaryRanges) => {
    setSalaryRanges((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const clearJobTypes = () => {
    setJobTypes({
      fulltime: false,
      parttime: false,
      internship: false,
      contract: false,
      cofounder: false,
    })
  }

  return (
    <div className="w-full lg:w-72 bg-white rounded-lg border border-gray-200 p-5">
      <h2 className="font-semibold text-lg mb-4">Filters</h2>
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search bounties..."
            className="w-full px-4 py-2 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <Search
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={18}
          />
        </div>
      </div>
      {/* Job Type */}
      <div className="mb-6">
        <h3 className="font-medium text-sm mb-3 flex justify-between items-center">
          <span>Job Type</span>
          <span
            className="text-blue-500 text-xs cursor-pointer"
            onClick={clearJobTypes}
          >
            Clear
          </span>
        </h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobTypes.fulltime}
              onChange={() => handleJobTypeChange('fulltime')}
            />
            <span className="ml-2 text-sm text-gray-700">Full-time</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobTypes.parttime}
              onChange={() => handleJobTypeChange('parttime')}
            />
            <span className="ml-2 text-sm text-gray-700">Part-time</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobTypes.internship}
              onChange={() => handleJobTypeChange('internship')}
            />
            <span className="ml-2 text-sm text-gray-700">Intership</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobTypes.contract}
              onChange={() => handleJobTypeChange('contract')}
            />
            <span className="ml-2 text-sm text-gray-700">
              Contract / Freelance
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobTypes.cofounder}
              onChange={() => handleJobTypeChange('cofounder')}
            />
            <span className="ml-2 text-sm text-gray-700">Co-founder</span>
          </label>
        </div>
      </div>
      {/* Job Roles */}
      <div className="mb-6">
        <h3 className="font-medium text-sm mb-3">Job Roles</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobRoles.programming}
              onChange={() => handleJobRoleChange('programming')}
            />
            <span className="ml-2 text-sm text-gray-700">Programming</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobRoles.design}
              onChange={() => handleJobRoleChange('design')}
            />
            <span className="ml-2 text-sm text-gray-700">Design</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobRoles.management}
              onChange={() => handleJobRoleChange('management')}
            />
            <span className="ml-2 text-sm text-gray-700">
              Management / Finance
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobRoles.support}
              onChange={() => handleJobRoleChange('support')}
            />
            <span className="ml-2 text-sm text-gray-700">Customer Support</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={jobRoles.sales}
              onChange={() => handleJobRoleChange('sales')}
            />
            <span className="ml-2 text-sm text-gray-700">
              Sales / Marketing
            </span>
          </label>
        </div>
      </div>
      {/* Remote Only */}
      <div className="mb-6">
        <h3 className="font-medium text-sm mb-3">Remote Only</h3>
        <div className="flex items-center">
          <div className="relative inline-block w-10 mr-2 align-middle">
            <input
              type="checkbox"
              id="remote-toggle"
              className="opacity-0 absolute h-0 w-0"
              checked={remoteOnly}
              onChange={(e) => setRemoteOnly(e.target.checked)}
            />
            <div
              className={`rounded-full h-6 w-11 cursor-pointer flex items-center transition-colors duration-200 ${
                remoteOnly ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <div
                className={`bg-white rounded-full h-5 w-5 shadow-md transform transition-transform duration-200 ${
                  remoteOnly ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              ></div>
            </div>
          </div>
          <label htmlFor="remote-toggle" className="text-sm text-gray-700">
            {remoteOnly ? 'On' : 'Off'}
          </label>
        </div>
      </div>
      {/* Salary Range */}
      <div className="mb-6">
        <h3 className="font-medium text-sm mb-3">Salary Range</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={salaryRanges.range1}
              onChange={() => handleSalaryRangeChange('range1')}
            />
            <span className="ml-2 text-sm text-gray-700">$20K - $50K</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={salaryRanges.range2}
              onChange={() => handleSalaryRangeChange('range2')}
            />
            <span className="ml-2 text-sm text-gray-700">$50K - $100K</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="form-checkbox h-4 w-4 text-purple-600 rounded"
              checked={salaryRanges.range3}
              onChange={() => handleSalaryRangeChange('range3')}
            />
            <span className="ml-2 text-sm text-gray-700">›$100K</span>
          </label>
        </div>
      </div>
      {/* Location */}
      <div>
        <h3 className="font-medium text-sm mb-3">Location</h3>
        <div className="relative">
          <select
            className="w-full px-4 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-purple-500"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          >
            <option>Anywhere</option>
            <option>Remote</option>
            <option>United States</option>
            <option>Europe</option>
            <option>Asia</option>
          </select>
          <ChevronDown
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
            size={16}
          />
        </div>
      </div>
    </div>
  )
}
