"use client"
import React, { useState } from 'react'     
import { useRouter } from 'next/navigation'
import { FreelancerProfileLayout } from '@/components/FreelancerProfileLayout'
import { Check } from 'lucide-react'
export function ProfileAbout() {
  const navigate = useRouter()
  const [jobRole, setJobRole] = useState('UI UX Designer')
  const [jobDescription, setJobDescription] = useState(
    'This is crispus explains my self as a consectetur adipiscing elit. Suspendisse eu pellentesque turpis. Vivamus a aliquam sapien, id euismod eros. Ut eget faucibus.',
  )
  const [selectedTools, setSelectedTools] = useState<string[]>([
    'FIGMA',
    'ADOBE XD',
  ])
  const [isSaved, setIsSaved] = useState(false)
  const handleToolSelection = (tool: string) => {
    if (selectedTools.includes(tool)) {
      setSelectedTools(selectedTools.filter((t) => t !== tool))
    } else {
      setSelectedTools([...selectedTools, tool])
    }
  }
  const handleContinue = () => {
    // Save data and navigate to next section
    navigate.push('/profile/social')
  }
  const handleJobRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setJobRole(e.target.value)
    setIsSaved(true)
    // Auto-hide the saved indicator after 2 seconds
    setTimeout(() => {
      setIsSaved(false)
    }, 2000)
  }
  const handleJobDescriptionChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setJobDescription(e.target.value)
  }
  return (
    <FreelancerProfileLayout
      activeTab="about"
      progress="1/3"
      detailsType="Overview"
    >
      <div className="space-y-8">
        <div>
          <div className="text-xs text-gray-500 uppercase mb-2">
            ENTER YOUR JOB ROLE
          </div>
          <div className="relative">
            <input
              type="text"
              value={jobRole}
              onChange={handleJobRoleChange}
              className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c]"
              placeholder="UI UX Designer"
            />
            {isSaved && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-1">
                  <Check size={12} />
                </div>
                <span className="text-sm">Saved</span>
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase mb-2">
            ENTER YOUR JOB DESCRIPTION
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <textarea
              value={jobDescription}
              onChange={handleJobDescriptionChange}
              className="w-full min-h-[100px] outline-none resize-none"
              placeholder="Add your job description here"
            />
            <div className="flex justify-end">
              <button className="flex items-center gap-1 text-sm text-purple-600">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 17H12.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                ASK AI
              </button>
            </div>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 uppercase mb-2">ADD TOOLS</div>
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex flex-wrap gap-2">
              <ToolButton
                name="FIGMA"
                selected={selectedTools.includes('FIGMA')}
                onClick={() => handleToolSelection('FIGMA')}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12 2H8.5C6.567 2 5 3.567 5 5.5C5 7.433 6.567 9 8.5 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 9C6.567 9 5 10.567 5 12.5C5 14.433 6.567 16 8.5 16H12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 16C13.933 16 15.5 14.433 15.5 12.5C15.5 10.567 13.933 9 12 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 2C13.933 2 15.5 3.567 15.5 5.5C15.5 7.433 13.933 9 12 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.5 19C15.5 17.067 13.933 15.5 12 15.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 15.5C10.067 15.5 8.5 17.067 8.5 19C8.5 20.933 10.067 22.5 12 22.5C13.933 22.5 15.5 20.933 15.5 19"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <ToolButton
                name="ADOBE XD"
                selected={selectedTools.includes('ADOBE XD')}
                onClick={() => handleToolSelection('ADOBE XD')}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 22H9C6.6 22 5.4 22 4.5 21.5C3.5 21 2.7 20.2 2.2 19.2C1.7 18.3 1.7 17.1 1.7 14.7V9.3C1.7 6.9 1.7 5.7 2.2 4.8C2.7 3.8 3.5 3 4.5 2.5C5.4 2 6.6 2 9 2H15C17.4 2 18.6 2 19.5 2.5C20.5 3 21.3 3.8 21.8 4.8C22.3 5.7 22.3 6.9 22.3 9.3V14.7C22.3 17.1 22.3 18.3 21.8 19.2C21.3 20.2 20.5 21 19.5 21.5C18.6 22 17.4 22 15 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 9L12 15L17 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M7 15L12 9L17 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
              <ToolButton
                name="SLACK"
                selected={selectedTools.includes('SLACK')}
                onClick={() => handleToolSelection('SLACK')}
                icon={
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14.5 10C13.67 10 13 9.33 13 8.5V3.5C13 2.67 13.67 2 14.5 2C15.33 2 16 2.67 16 3.5V8.5C16 9.33 15.33 10 14.5 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M20.5 10H19V8.5C19 7.67 19.67 7 20.5 7C21.33 7 22 7.67 22 8.5C22 9.33 21.33 10 20.5 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.5 14C10.33 14 11 14.67 11 15.5V20.5C11 21.33 10.33 22 9.5 22C8.67 22 8 21.33 8 20.5V15.5C8 14.67 8.67 14 9.5 14Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M3.5 14H5V15.5C5 16.33 4.33 17 3.5 17C2.67 17 2 16.33 2 15.5C2 14.67 2.67 14 3.5 14Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 14.5C14 13.67 14.67 13 15.5 13H20.5C21.33 13 22 13.67 22 14.5C22 15.33 21.33 16 20.5 16H15.5C14.67 16 14 15.33 14 14.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M15.5 19H14V20.5C14 21.33 14.67 22 15.5 22C16.33 22 17 21.33 17 20.5C17 19.67 16.33 19 15.5 19Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 9.5C10 10.33 9.33 11 8.5 11H3.5C2.67 11 2 10.33 2 9.5C2 8.67 2.67 8 3.5 8H8.5C9.33 8 10 8.67 10 9.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2C7.67 2 7 2.67 7 3.5C7 4.33 7.67 5 8.5 5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                }
              />
            </div>
          </div>
        </div>
        <div className="flex justify-center pt-6">
          <button
            onClick={handleContinue}
            className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </FreelancerProfileLayout>
  )
}
interface ToolButtonProps {
  name: string
  selected: boolean
  onClick: () => void
  icon: React.ReactNode
}
function ToolButton({ name, selected, onClick, icon }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md border ${selected ? 'border-gray-400 bg-gray-50' : 'border-gray-200'}`}
    >
      {icon}
      {name}
      {selected && (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 6L18 18"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  )
}
