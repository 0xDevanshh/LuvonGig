'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useServiceForm } from '@/context/ServiceFormContext'
import { AddProjectNav } from '@/components/freelancer/AddProjectNav'
import { Sparkles } from 'lucide-react'
import RichTextEditor from '@/components/editor/RichTextEditor'
import '@/components/editor/markdown-styles.css'
export default function AddServiceOverview() {
  const router = useRouter()
  const { formData, updateFormData, isSaved, setSaved } = useServiceForm()
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false)
  const categories = [
    'Web Designer',
    'UI/UX Designer',
    'Graphic Designer',
    'Frontend Developer',
    'Full Stack Developer',
  ]
  const subCategories = [
    'Web Design',
    'Mobile Design',
    'Logo Design',
    'Branding',
    'Illustration',
  ]
  const handleServiceTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({
      serviceTitle: e.target.value,
    })
    setSaved('serviceTitle', true)
  }
  const handleCategorySelect = (category: string) => {
    updateFormData({
      mainCategory: category,
    })
    setShowCategoryDropdown(false)
  }
  const handleSubCategorySelect = (subCategory: string) => {
    updateFormData({
      subCategory: subCategory,
    })
    setShowSubCategoryDropdown(false)
  }

  const handleDescriptionChange = (description: string) => {
    updateFormData({
      description: description,
    })
    setSaved('description', true)
  }
  const handleContinue = () => {
    router.push('/freelancer/add-service/projects')
  }
  return (
    <div className="flex flex-col min-h-screen bg-white">
      
      <main className="flex-1 container mx-auto py-6 px-4 max-w-5xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#161616]">
            Add Your Services
          </h1>
          <div className="text-sm text-gray-600">
            Overview Details: <span className="font-medium">1/5 Done</span>
          </div>
        </div>
        <AddProjectNav />
        <div className="mt-12">
          <div className="mb-8">
            <div className="text-xs text-gray-500 uppercase mb-1">
              SERVICE TITLE
            </div>
            <div className="relative bg-white border border-gray-200 rounded-lg p-4">
              <input
                type="text"
                placeholder="Describe the service you're offering in a concise, clear title."
                value={formData.serviceTitle}
                onChange={handleServiceTitleChange}
                className="w-full outline-none text-lg"
              />
              {isSaved.serviceTitle ? (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-green-600">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-green-500"
                  >
                    <path
                      d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="ml-1 text-sm">Saved</span>
                </div>
              ) : (
                <button className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center text-gray-500 bg-gray-50 px-3 py-1 rounded-md">
                  <Sparkles size={16} className="mr-1" />
                  <span className="text-sm">Ask AI</span>
                </button>
              )}
            </div>
          </div>
          <div className="mb-8">
            <div className="text-xs text-gray-500 uppercase mb-1">
              MAIN CATEGORY
            </div>
            <div className="relative">
              <div
                className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center cursor-pointer"
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <span className="text-lg">{formData.mainCategory}</span>
                <button className="text-sm text-gray-600 flex items-center px-2 py-1 rounded bg-gray-50">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mr-1"
                  >
                    <path
                      d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13M19.5858 3.58579C18.8047 2.80474 17.5489 2.80474 16.7678 3.58579L9.5 10.8536V13.5H12.1464L19.4142 6.23223C20.1953 5.45118 20.1953 4.19534 19.4142 3.41429L19.5858 3.58579Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Edit
                </button>
              </div>
              {showCategoryDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {categories.map((category) => (
                    <div
                      key={category}
                      className="p-3 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mb-8">
            <div className="text-xs text-gray-500 uppercase mb-1">
              SUB-CATEGORY
            </div>
            <div className="relative">
              <div
                className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center cursor-pointer"
                onClick={() =>
                  setShowSubCategoryDropdown(!showSubCategoryDropdown)
                }
              >
                <span className="text-lg">
                  {formData.subCategory || 'Sub-Category'}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-500"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
              {showSubCategoryDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {subCategories.map((subCategory) => (
                    <div
                      key={subCategory}
                      className="p-3 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleSubCategorySelect(subCategory)}
                    >
                      {subCategory}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          <div className="mb-8">
            <RichTextEditor
              label="DESCRIPTION"
              value={formData.description}
              onChange={handleDescriptionChange}
              placeholder="Describe your service in detail. Include what you'll deliver, your process, timeline, and what makes your service unique. Use markdown formatting to structure your description."
              minHeight={300}
              maxLength={2000}
              helpText="Write a detailed description to help clients understand your service better. Use formatting to highlight key points."
              aiAssist={true}
              showPreview={true}
            />
            {isSaved.description && (
              <div className="mt-2 flex items-center text-green-600 text-sm">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-green-500 mr-1"
                >
                  <path
                    d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM8 15L3 10L4.41 8.59L8 12.17L15.59 4.58L17 6L8 15Z"
                    fill="currentColor"
                  />
                </svg>
                Description saved
              </div>
            )}
          </div>

          <div className="flex justify-center mt-12">
            <button
              onClick={handleContinue}
              className="px-12 py-3 bg-rainbow-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity"
            >
              Continue
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}