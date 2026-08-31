"use client"
import React, { useState, useMemo } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ProgressStepper } from '@/components/progress-stepper'
import { ProfilePreview } from '@/components/ProfilePreview'
import { SkillTag } from '@/components/skillTag'
import { useOnboardingSession as useOnboarding } from '@/hooks/useOnboardingSession'

// Predefined skills based on common freelance categories
const PREDEFINED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Python',
  'Java', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Swift', 'Kotlin',
  'HTML', 'CSS', 'Sass', 'Tailwind CSS', 'Bootstrap', 'Figma',
  'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'UI Design',
  'UX Design', 'Graphic Design', 'Web Design', 'Product Design',
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'DevOps',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Elasticsearch',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Testing', 'TDD',
  'Machine Learning', 'Data Science', 'AI', 'Deep Learning',
  'React Native', 'Flutter', 'iOS Development', 'Android Development',
  'Blockchain', 'Web3', 'Smart Contracts', 'Solidity',
  'Marketing', 'SEO', 'Content Writing', 'Copywriting',
  'Project Management', 'Agile', 'Scrum', 'Leadership'
]
export function SkillsSelection() {
  const [skillInput, setSkillInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isAddingSkill, setIsAddingSkill] = useState(false)

  const {
    skills,
    profile,
    address,
    error,
    setError,
    addSkill,
    removeSkill,
    goToNextStep,
    goToPreviousStep,
    isLoading
  } = useOnboarding()

  // Log current onboarding progress when component mounts
  React.useEffect(() => {
    console.log('=== ONBOARDING STEP 4: SKILLS - CURRENT PROGRESS ===');
    console.log('📊 Progress Summary:');
    console.log('  • Profile Complete:', !!(profile.firstName && profile.lastName));
    console.log('  • Address Complete:', !!(address.city && address.state && address.zipCode));
    console.log('  • Skills Count:', skills.length);
    console.log('  • Current Data:', { profile, address, skills });
    console.log('================================================');
  }, [])

  // Filter suggestions based on input and existing skills
  const filteredSuggestions = useMemo(() => {
    if (!skillInput.trim()) return [];

    return PREDEFINED_SKILLS.filter(skill =>
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !skills.includes(skill)
    ).slice(0, 8);
  }, [skillInput, skills]);

  const handleAddSkill = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault()
      setIsAddingSkill(true)

      try {
        const success = addSkill(skillInput.trim())
        if (success) {
          setSkillInput('')
          setShowSuggestions(false)
          setError('')
        } else {
          setError('Failed to add skill')
        }
      } finally {
        setIsAddingSkill(false)
      }
    }
  }

  const handleAddSuggestedSkill = async (skill: string) => {
    setIsAddingSkill(true)

    try {
      const success = addSkill(skill)
      if (success) {
        setSkillInput('')
        setShowSuggestions(false)
        setError('')
      }
    } finally {
      setIsAddingSkill(false)
    }
  }

  const handleInputChange = (value: string) => {
    setSkillInput(value)
    setError('')
    setShowSuggestions(true)
  }

  const handleNext = async () => {
    if (skills.length === 0) {
      setError('Please add at least one skill')
      return
    }

    // Log skills step completion
    console.log('=== ONBOARDING STEP 4: SKILLS COMPLETED ===');
    console.log('🎯 Skills Data:');
    console.log('  • Total Skills:', skills.length);
    console.log('  • Skills List:', skills.join(', '));
    console.log('  • Skills Array:', skills);
    console.log('==========================================');

    await goToNextStep(4)
  }

  const handleRemoveSkill = (skill: string) => {
    removeSkill(skill)
  }

  const handleBack = () => {
    goToPreviousStep(4)
  }
  return (
    <div className="flex flex-col min-h-screen bg-[#fcfcfc]">
     
      <div className="flex-1">
        <div className="container mx-auto py-8 px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="mb-8">
                <ProgressStepper currentStep={4} totalSteps={5} />
              </div>
              <h1 className="text-3xl font-bold text-[#161616] mb-8">
                What are your skills?
              </h1>
              <p className="text-gray-600 mb-6">
                Add your key skills (max 20). Start typing to see suggestions or add custom skills.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                  {error}
                </div>
              )}

              <div className="mb-8">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type a skill and press Enter..."
                    value={skillInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleAddSkill}
                    onFocus={() => skillInput.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    disabled={isAddingSkill}
                    className={`w-full py-3 px-4 border border-[#cacaca] rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2ba24c] text-[#161616] placeholder-gray-500 ${
                      isAddingSkill ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  />

                  {isAddingSkill && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    </div>
                  )}

                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleAddSuggestedSkill(suggestion)}
                          className={`px-4 py-2 text-sm text-gray-700 cursor-pointer ${
                            isAddingSkill ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'
                          }`}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <SkillTag
                      key={index}
                      skill={skill}
                      onRemove={() => handleRemoveSkill(skill)}
                    />
                  ))}
                </div>

                {skills.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    {skills.length} of 20 skills added
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="px-12 py-3 border border-[#000000] rounded-full font-bold text-[#161616] hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={isLoading}
                  className="px-12 py-3 bg-[#000000] text-white rounded-full font-bold shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Saving...' : 'Next'}
                </button>
              </div>
            </div>
            <div className="hidden md:block">
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
                profileImage={profile.profileImage}
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
