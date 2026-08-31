"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FreelancerProfileLayout } from '@/components/FreelancerProfileLayout';
import { Plus, ChevronDown, Video } from 'lucide-react';
export function ProfileOthers() {
  const navigate = useRouter();
  const [skills, setSkills] = useState<string[]>(['UI/UX Design', 'Web Design', 'Prototyping']);
  const [skillInput, setSkillInput] = useState('');
  const [languages, setLanguages] = useState<Array<{
    name: string;
    proficiency: string;
  }>>([{
    name: 'Hindi',
    proficiency: 'Native or Bilingual'
  }, {
    name: 'English',
    proficiency: 'Fluent'
  }]);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedProficiency, setSelectedProficiency] = useState('');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showProficiencyDropdown, setShowProficiencyDropdown] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const languageOptions = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Arabic'];
  const proficiencyOptions = ['Native or Bilingual', 'Fluent', 'Intermediate', 'Basic'];
  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };
  const handleAddLanguage = () => {
    if (selectedLanguage && selectedProficiency) {
      setLanguages([...languages, {
        name: selectedLanguage,
        proficiency: selectedProficiency
      }]);
      setSelectedLanguage('');
      setSelectedProficiency('');
    }
  };
  const handleRemoveLanguage = (languageName: string) => {
    setLanguages(languages.filter(lang => lang.name !== languageName));
  };
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoFile(e.target.files[0]);
    }
  };
  const handleFinish = () => {
    // Save data and navigate to preview page
    navigate.push('/profile/preview');
  };
  return <FreelancerProfileLayout activeTab="others" progress="1/3" detailsType="Work">
      <div>
        <h2 className="text-xl font-semibold text-[#161616] mb-6">
          Other Requirements
        </h2>
        <div className="space-y-8">
          {/* Languages Section */}
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-4">
              SELECT LANGUAGE
            </label>
            <div className="space-y-4">
              {languages.map((lang, index) => <div key={index} className="flex flex-col p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium">{lang.name}</h3>
                    <button onClick={() => handleRemoveLanguage(lang.name)} className="text-gray-500">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-sm text-[#2ba24c]">{lang.proficiency}</p>
                </div>)}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <button type="button" onClick={() => setShowLanguageDropdown(!showLanguageDropdown)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c] flex justify-between items-center">
                    <span className={selectedLanguage ? 'text-black' : 'text-gray-400'}>
                      {selectedLanguage || 'Select Language'}
                    </span>
                    <ChevronDown size={20} className="text-gray-400" />
                  </button>
                  {showLanguageDropdown && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {languageOptions.map(lang => <button key={lang} className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => {
                    setSelectedLanguage(lang);
                    setShowLanguageDropdown(false);
                  }}>
                          {lang}
                        </button>)}
                    </div>}
                </div>
                <div className="relative">
                  <button type="button" onClick={() => setShowProficiencyDropdown(!showProficiencyDropdown)} className="w-full p-4 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2ba24c] flex justify-between items-center">
                    <span className={selectedProficiency ? 'text-black' : 'text-gray-400'}>
                      {selectedProficiency || 'Select the Role'}
                    </span>
                    <ChevronDown size={20} className="text-gray-400" />
                  </button>
                  {showProficiencyDropdown && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {proficiencyOptions.map(prof => <button key={prof} className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => {
                    setSelectedProficiency(prof);
                    setShowProficiencyDropdown(false);
                  }}>
                          {prof}
                        </button>)}
                    </div>}
                </div>
              </div>
              <button onClick={handleAddLanguage} disabled={!selectedLanguage || !selectedProficiency} className={`flex items-center gap-2 ${selectedLanguage && selectedProficiency ? 'text-blue-600' : 'text-gray-400'}`}>
                <Plus size={16} className={selectedLanguage && selectedProficiency ? 'text-blue-600' : 'text-gray-400'} />
                ADD MORE LANGUAGE
              </button>
            </div>
          </div>
          {/* Skills Section */}
          <div>
            <label className="block text-xs text-gray-500 uppercase mb-2">
              ADD YOUR SKILLS
            </label>
            <div className="border border-gray-200 rounded-lg p-4">
              <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleAddSkill} className="w-full outline-none mb-4" placeholder="Type a skill and press Enter" />
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => <div key={index} className="flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full">
                    <span>{skill}</span>
                    <button onClick={() => handleRemoveSkill(skill)} className="text-gray-500 hover:text-gray-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>)}
              </div>
            </div>
          </div>
          {/* Video Upload Section */}
          <div>
            <h3 className="text-base font-medium mb-2">
              Upload Your Intro Video Here (Optional)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Click here to upload the intro video
            </p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Video className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  {videoFile ? videoFile.name : 'Click to upload video'}
                </p>
              </div>
              <input type="file" className="hidden" accept="video/*" onChange={handleVideoUpload} />
            </label>
          </div>
        </div>
        <div className="flex justify-center pt-10">
          <button onClick={handleFinish} className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Finish
          </button>
        </div>
      </div>
    </FreelancerProfileLayout>;
}