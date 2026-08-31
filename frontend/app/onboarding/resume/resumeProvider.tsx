"use client"
import React, { useState } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProgressStepper } from '@/components/progress-stepper'
import { ProfilePreview } from '@/components/ProfilePreview'
import { useRouter } from 'next/navigation'
import { File } from 'lucide-react'
import { useOnboardingSession as useOnboarding } from '@/hooks/useOnboardingSession'

export function ResumeUpload() {
  const navigate = useRouter()

  const {
    resume,
    profile,
    skills,
    address,
    error,
    updateResume,
    updateProfile,
    completeOnboarding,
    goToPreviousStep,
    isLoading,
    debugData
  } = useOnboarding()

  const [isUploading, setIsUploading] = useState(false)

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type - only PDF
      if (file.type !== 'application/pdf') {
        alert('Only PDF files are allowed. Please upload a PDF file.')
        return
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        alert('File size must be less than 10MB.')
        return
      }

      setIsUploading(true)

      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/upload/resume', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (result.success) {
          updateResume({
            fileName: file.name,
            file: file,
            fileUrl: result.url, // Changed from result.fileUrl to result.url
            hasResume: true
          })
        } else {
          alert(result.error || 'Failed to upload resume')
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Failed to upload resume. Please try again.')
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleBack = () => {
    goToPreviousStep(5)
  }

  const handleDebugData = () => {
    console.log('🔍 DEBUG: Current session data state:');
    debugData();

    // Check session storage directly
    const rawData = sessionStorage.getItem('onboarding_session_data');
    console.log('💾 Raw session storage data:', rawData);
    if (rawData) {
      try {
        const parsed = JSON.parse(rawData);
        console.log('📥 Parsed session storage data:', parsed);
      } catch (e) {
        console.error('❌ Error parsing session storage data:', e);
      }
    }
  }

  const handleComplete = async () => {
    try {
      // Log resume step completion
      console.log('=== ONBOARDING STEP 5: RESUME COMPLETED ===');
      console.log('📄 Resume Data:');
      console.log('  • Has Resume:', resume.hasResume ? 'Yes' : 'No');
      console.log('  • File Name:', resume.fileName || 'Not provided');
      console.log('  • File URL:', resume.fileUrl || 'Not provided');
      console.log('==========================================');

      // Debug data before completing
      handleDebugData();

      // Save complete onboarding data to canister
      await completeOnboarding()
      navigate.push('/onboarding/verification-complete')
    } catch (error) {
      console.error('❌ Failed to complete onboarding:', error)
      console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">

      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1 lg:flex-initial lg:w-2/3">
              <div className="mb-8">
                <ProgressStepper currentStep={5} totalSteps={5} />
              </div>
              <h1 className="text-3xl font-bold text-[#161616] mb-8">
                Almost Done! Add your Resume (Optional)
              </h1>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              {/* Resume Upload Section */}
              <div className="mb-8">
                <div className="uppercase text-sm text-gray-500 mb-2">
                  ADD YOUR RESUME (OPTIONAL)
                </div>
                <div className="border border-[#cacaca] rounded-md p-6 relative">
                  <label className={`flex items-center cursor-pointer ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="mr-4">
                      <File className="text-gray-500" size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-600 hover:underline font-medium">
                        {isUploading ? 'Uploading...' : resume.fileName || 'Click here to upload Your Resume (Optional)'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Only PDF files are accepted • Maximum file size: 10MB
                      </div>
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={handleResumeChange}
                      disabled={isUploading}
                    />
                  </label>
                  {isUploading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 rounded-md flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* LinkedIn Profile Section */}
              <div className="mb-8">
                <div className="uppercase text-sm text-gray-500 mb-2">
                  ADD LINKEDIN PROFILE
                </div>
                <input
                  type="text"
                  placeholder="Add your profile Link Here"
                  value={profile.linkedin}
                  onChange={(e) => updateProfile({ linkedin: e.target.value })}
                  className="w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#7d7d7d]"
                />
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="px-12 py-3 border border-[#000000] rounded-full font-bold text-[#161616] hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                {/* <button
                  onClick={handleDebugData}
                  className="px-6 py-3 border border-orange-500 text-orange-500 rounded-full font-bold hover:bg-orange-50 transition-colors"
                >
                  Debug Data
                </button> */}
                <button
                  onClick={handleComplete}
                  disabled={isLoading}
                  className="px-12 py-3 bg-[#000000] text-white rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Completing...' : 'Yay! Let\'s Go To Workspace'}
                </button>
              </div>
            </div>

            {/* Sidebar Preview */}
            <div className="hidden lg:block lg:flex-initial lg:w-1/3">
              <div className="space-y-6">
                {/* Profile Preview */}
                <ProfilePreview
                  firstName={profile.firstName}
                  lastName={profile.lastName}
                  bio={profile.bio}
                  phone={profile.phone}
                  location={profile.location}
                  website={profile.website}
                  linkedin={profile.linkedin}
                  github={profile.github}
                  twitter={profile.twitter}
                  skills={skills.length > 0 ? skills : []}
                  hasResume={resume.hasResume}
                  profileImage={profile.profileImage}
                />

                {/* Resume Preview */}
                {resume.fileUrl && (
                  <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-[#161616] mb-4 flex items-center">
                      <File size={20} className="mr-2 text-blue-600" />
                      Resume Preview
                    </h3>
                    <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                      <iframe
                        src={resume.fileUrl}
                        className="w-full h-full"
                        title="Resume Preview"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {resume.fileName}
                      </div>
                      <a
                        href={resume.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}