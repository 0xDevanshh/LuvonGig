"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FreelancerProfileLayout } from '@/components/FreelancerProfileLayout';
import { Plus } from 'lucide-react';
export function ProfileSocial() {
  const navigate = useRouter();
  const [portfolioWebsite, setPortfolioWebsite] = useState('');
  const [socialLinks, setSocialLinks] = useState({
    linkedin: false,
    instagram: false,
    twitter: false
  });
  const handleContinue = () => {
    // Save data and navigate to next section
    navigate.push ('/profile/social');
  };
  const toggleSocialLink = (platform: keyof typeof socialLinks) => {
    setSocialLinks({
      ...socialLinks,
      [platform]: !socialLinks[platform]
    });
  };
  return <FreelancerProfileLayout activeTab="social" progress="1/3" detailsType="About">
      <div className="space-y-8">
        <div>
          <div className="text-xs text-gray-500 uppercase mb-2">
            ADD PORTFOLIO WEBSLISTE
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <input type="url" value={portfolioWebsite} onChange={e => setPortfolioWebsite(e.target.value)} className="w-full outline-none" placeholder="Add your profile Link Here" />
          </div>
        </div>
        <div>
          <button className="flex items-center gap-2 text-blue-600" onClick={() => {}}>
            <Plus size={16} className="text-blue-600" />
            ADD MORE LINKS
          </button>
          <div className="flex gap-4 mt-4">
            <button onClick={() => toggleSocialLink('linkedin')} className={`w-10 h-10 flex items-center justify-center rounded-md border ${socialLinks.linkedin ? 'border-blue-600 bg-blue-50' : 'border-gray-200'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={() => toggleSocialLink('instagram')} className={`w-10 h-10 flex items-center justify-center rounded-md border ${socialLinks.instagram ? 'border-pink-600 bg-pink-50' : 'border-gray-200'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 2H7C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5932 15.1514 13.8416 15.5297C13.0901 15.9079 12.2385 16.0396 11.4078 15.9059C10.5771 15.7723 9.80977 15.3801 9.21485 14.7852C8.61993 14.1902 8.22774 13.4229 8.09408 12.5922C7.96042 11.7615 8.09208 10.9099 8.47034 10.1584C8.8486 9.40685 9.4542 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87659 12.63 8C13.4789 8.12588 14.2649 8.52146 14.8717 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17.5 6.5H17.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button onClick={() => toggleSocialLink('twitter')} className={`w-10 h-10 flex items-center justify-center rounded-md border ${socialLinks.twitter ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 4C22 4 21.3 6.1 20 7.4C21.6 17.4 10.6 24.7 2 19C4.2 19.1 6.4 18.4 8 17C3 15.5 0.5 9.6 3 5C5.2 7.6 8.6 9.1 12 9C11.1 4.8 16 2.4 19 5.2C20.1 5.2 22 4 22 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex justify-center pt-6">
          <button onClick={handleContinue} className="px-12 py-3 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
            Next
          </button>
        </div>
      </div>
    </FreelancerProfileLayout>;
}