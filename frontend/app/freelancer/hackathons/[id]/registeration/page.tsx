'use client'
import React, { useState } from 'react'
import { Header1 } from '@/components/Header1'
import { Sidebar } from '@/components/Sidebar'
import { ChevronLeft, Users, FileText, Code, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
export default function HackathonRegistration() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    skills: [] as string[],
    experience: '',
    projectIdea: '',
    teamOption: 'join',
    teamName: '',
    agreeToRules: false,
  })
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }
  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => {
      const updatedSkills = prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill]
      return {
        ...prev,
        skills: updatedSkills,
      }
    })
  }
  const handleNext = () => {
    setStep((prev) => prev + 1)
  }
  const handlePrevious = () => {
    setStep((prev) => prev - 1)
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Submit registration data
    router.push('/freelancer/hackathons/registration-confirmation')
  }
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Skills & Experience</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Skills
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'JavaScript',
                    'TypeScript',
                    'React',
                    'Node.js',
                    'Python',
                    'Blockchain',
                    'Smart Contracts',
                    'UI/UX Design',
                  ].map((skill) => (
                    <div key={skill} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => handleSkillToggle(skill)}
                        className={`px-3 py-1.5 rounded-md text-sm flex items-center ${formData.skills.includes(skill) ? 'bg-purple-100 text-purple-700 border border-purple-300' : 'bg-gray-100 text-gray-700 border border-gray-200'}`}
                      >
                        {formData.skills.includes(skill) && (
                          <Check size={14} className="mr-1" />
                        )}
                        {skill}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="experience"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Relevant Experience
                </label>
                <textarea
                  id="experience"
                  name="experience"
                  value={formData.experience}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md h-32"
                  placeholder="Tell us about your experience with hackathons or related projects"
                ></textarea>
              </div>
            </div>
          </div>
        )
      case 3:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Project & Team</h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="projectIdea"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Project Idea (Optional)
                </label>
                <textarea
                  id="projectIdea"
                  name="projectIdea"
                  value={formData.projectIdea}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md h-32"
                  placeholder="Describe your project idea if you have one"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team Preference
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="teamOption"
                      value="join"
                      checked={formData.teamOption === 'join'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span>Join a team</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="teamOption"
                      value="create"
                      checked={formData.teamOption === 'create'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span>Create a team</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="teamOption"
                      value="solo"
                      checked={formData.teamOption === 'solo'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span>Participate solo</span>
                  </label>
                </div>
              </div>
              {formData.teamOption === 'create' && (
                <div>
                  <label
                    htmlFor="teamName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Team Name
                  </label>
                  <input
                    type="text"
                    id="teamName"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        )
      case 4:
        return (
          <div>
            <h2 className="text-xl font-bold mb-4">Confirmation</h2>
            <div className="space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <p className="text-sm text-blue-700">
                  Please review your information before submitting. You will
                  receive a confirmation email with further details.
                </p>
              </div>
              <div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    name="agreeToRules"
                    checked={formData.agreeToRules}
                    onChange={handleCheckboxChange}
                    className="mt-1 mr-2"
                    required
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the hackathon rules and code of conduct. I
                    understand that my registration is subject to approval.
                  </span>
                </label>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full py-2 bg-rainbow-gradient text-white rounded-lg hover:opacity-90 font-medium"
                >
                  Complete Registration
                </button>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }
  return (
    <div className="flex min-h-screen bg-white">
      
      <div className="flex-1 flex flex-col">
        
        <main className="flex-1 p-6">
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <Link
                href="/freelancer/hackathons"
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft size={16} className="mr-1" />
                <span>Back to Hackathons</span>
              </Link>
              <h1 className="text-2xl font-bold mt-4">
                Web3 Security Challenge Registration
              </h1>
              <p className="text-gray-600">
                Complete the form below to register for the hackathon
              </p>
            </div>
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    <FileText size={20} />
                  </div>
                  <span className="text-xs mt-1">Personal</span>
                </div>
                <div
                  className={`flex-1 h-1 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}
                ></div>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    <Code size={20} />
                  </div>
                  <span className="text-xs mt-1">Skills</span>
                </div>
                <div
                  className={`flex-1 h-1 ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}
                ></div>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    <Users size={20} />
                  </div>
                  <span className="text-xs mt-1">Team</span>
                </div>
                <div
                  className={`flex-1 h-1 ${step >= 4 ? 'bg-blue-500' : 'bg-gray-200'}`}
                ></div>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 4 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                  >
                    <Check size={20} />
                  </div>
                  <span className="text-xs mt-1">Confirm</span>
                </div>
              </div>
            </div>
            {/* Form */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <form onSubmit={handleSubmit}>
                {renderStepContent()}
                <div className="flex justify-between mt-8">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevious}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  ) : (
                    <div></div>
                  )}
                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Next
                    </button>
                  ) : null}
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
