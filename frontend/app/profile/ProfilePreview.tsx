"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Edit2, Monitor, Smartphone } from 'lucide-react';
import Image from 'next/image';
export function ProfilePreview() {
  const navigate = useRouter();
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const handleGoBack = () => {
    navigate.push('/profile/others');
  };
  const handlePublish = () => {
    navigate.push('/profile/dashboard');
  };
  return <div className="flex flex-col min-h-screen bg-white">
    <header className="flex justify-between items-center p-4 border-b border-gray-200">
      <img src="/WB.png" alt="Workbudd Logo" className="h-6" />

      <div className="flex items-center gap-4">
        <button onClick={handleGoBack} className="flex items-center text-gray-600">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
            <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Go Back And Edit
        </button>
        <button onClick={handlePublish} className="px-6 py-2 bg-[#0B1F36] text-white rounded-full font-medium hover:bg-[#1a3a5f] transition-colors">
          Publish
        </button>
      </div>
    </header>
    <div className="flex justify-center my-4">
      <div className="flex bg-gray-100 rounded-full p-1">
        <button onClick={() => setViewMode('desktop')} className={`p-2 rounded-full ${viewMode === 'desktop' ? 'bg-white shadow-sm' : ''}`}>
          <Monitor size={20} className="text-gray-600" />
        </button>
        <button onClick={() => setViewMode('mobile')} className={`p-2 rounded-full ${viewMode === 'mobile' ? 'bg-white shadow-sm' : ''}`}>
          <Smartphone size={20} className="text-gray-600" />
        </button>
      </div>
    </div>
    <div className="text-center text-gray-500 mb-6">Preview Page</div>
    <div className={`mx-auto ${viewMode === 'mobile' ? 'max-w-sm' : 'max-w-4xl'}`}>
      <div className="bg-white rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex flex-col items-center md:items-start">
            <div className="relative">
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&auto=format&fit=crop" alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-white shadow-md" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-green-500 border border-gray-200">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <h1 className="text-2xl font-bold">Vivek Mehta</h1>
              <button className="mt-1 text-green-500 text-sm flex items-center">
                <Edit2 size={12} className="mr-1" />
                Verified
              </button>
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-4">
              <h2 className="text-xl font-bold">I am Vivek,</h2>
              <h3 className="text-lg font-bold mb-2">
                A Web Developer working From 5 years.
                <br />
                Hereto help startups & businesses
              </h3>
              <p className="text-sm text-gray-600">
                Experienced Product Designer, previously a key contributor to
                web product design in collaboration with the founders at Post
                News. I thrive in the art of crafting products that not only
                capture attention but also ignite meaningful connections and
                drive business growth.
              </p>
            </div>
            <div className="flex gap-4">
              <a href="#" className="text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 4C22 4 21.3 6.1 20 7.4C21.6 17.4 10.6 24.7 2 19C4.2 19.1 6.4 18.4 8 17C3 15.5 0.5 9.6 3 5C5.2 7.6 8.6 9.1 12 9C11.1 4.8 16 2.4 19 5.2C20.1 5.2 22 4 22 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="#" className="text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17 2H7C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 11.37C16.1234 12.2022 15.9813 13.0522 15.5938 13.799C15.2063 14.5458 14.5932 15.1514 13.8416 15.5297C13.0901 15.9079 12.2385 16.0396 11.4078 15.9059C10.5771 15.7723 9.80977 15.3801 9.21485 14.7852C8.61993 14.1902 8.22774 13.4229 8.09408 12.5922C7.96042 11.7615 8.09208 10.9099 8.47034 10.1584C8.8486 9.40685 9.4542 8.79374 10.201 8.40624C10.9478 8.01874 11.7978 7.87659 12.63 8C13.4789 8.12588 14.2649 8.52146 14.8717 9.1283C15.4785 9.73515 15.8741 10.5211 16 11.37Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17.5 6.5H17.51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="#" className="text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 22V18C15.1392 16.7473 14.78 15.4901 14 14.5C17 14.5 20 12.5 20 9C20.08 7.75 19.73 6.52 19 5.5C19.28 4.35 19.28 3.15 19 2C19 2 18 2 16 3.5C13.36 3 10.64 3 8 3.5C6 2 5 2 5 2C4.7 3.15 4.7 4.35 5 5.5C4.27188 6.51588 3.91848 7.75279 4 9C4 12.5 7 14.5 10 14.5C9.61 14.99 9.32 15.55 9.15 16.15C8.98 16.75 8.93 17.38 9 18V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M9 18C4.49 20 4 16 2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <a href="#" className="text-gray-600">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 8C17.5913 8 19.1174 8.63214 20.2426 9.75736C21.3679 10.8826 22 12.4087 22 14V21H18V14C18 13.4696 17.7893 12.9609 17.4142 12.5858C17.0391 12.2107 16.5304 12 16 12C15.4696 12 14.9609 12.2107 14.5858 12.5858C14.2107 12.9609 14 13.4696 14 14V21H10V14C10 12.4087 10.6321 10.8826 11.7574 9.75736C12.8826 8.63214 14.4087 8 16 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 9H2V21H6V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4 6C5.10457 6 6 5.10457 6 4C6 2.89543 5.10457 2 4 2C2.89543 2 2 2.89543 2 4C2 5.10457 2.89543 6 4 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm text-gray-500 uppercase">SKILLS</h3>
            <div className="text-green-500">
              <Edit2 size={14} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Prototyping', 'Development', 'Prototyping', 'Wireframing', 'Prototyping'].map((skill, index) => <div key={index} className="px-4 py-1 border border-gray-200 rounded-full text-sm">
              {skill}
            </div>)}
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 21V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-base font-bold">WORK EXPERIENCE</h3>
            <div className="text-green-500">
              <Edit2 size={14} />
            </div>
          </div>
          {[1, 2, 3].map(item => <div key={item} className="mb-6">
            <h4 className="font-bold">Frontend Web Developer</h4>
            <h5 className="text-gray-700">
              Levitating Elephant Technologies Pvt Ltd
            </h5>
            <p className="text-sm text-gray-600 mb-2">
              Experienced Product Designer, previously a key contributor to
              web product design in collaboration with the founders at Post
              News.
            </p>
            <p className="text-xs text-gray-500">June 2022 - July 2023</p>
          </div>)}
        </div>
        <div className="flex flex-col md:flex-row gap-8 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold">LANGUAGE</h3>
              <div className="text-green-500">
                <Edit2 size={14} />
              </div>
            </div>
            <div className="mb-2">
              <div className="flex justify-between">
                <span>English</span>
                <span className="text-green-500 text-sm">Fluent</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <span>Hindi</span>
                <span className="text-green-500 text-sm">
                  Native or Bilingual
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold">LOCATION</h3>
              <div className="text-green-500">
                <Edit2 size={14} />
              </div>
            </div>
            <div className="flex items-start gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>California, CA, USA</span>
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8.5 10C9.32843 10 10 9.32843 10 8.5C10 7.67157 9.32843 7 8.5 7C7.67157 7 7 7.67157 7 8.5C7 9.32843 7.67157 10 8.5 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-base font-bold">WORK PORTFOLIO</h3>
            <div className="text-green-500">
              <Edit2 size={14} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(item => <div key={item} className="border border-gray-200 rounded-lg overflow-hidden">
              <img src={`https://uploadthingy.s3.us-west-1.amazonaws.com/tcCeq3yFDgWdD8vAU5s9Vv/Organaise_Freelancer_Onboarding_-_Profile_Page-${item}.png`} alt={`Portfolio item ${item}`} className="w-full h-40 object-cover" />
              <div className="p-3">
                <h4 className="font-bold text-sm">
                  Levitating Elephant Technologies Pvt Ltd
                </h4>
                <p className="text-xs text-gray-600 truncate">
                  Experienced Product Designer, previously a key contributor
                  to web product design in collaboration with the
                  founders...
                </p>
              </div>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </div>;
}