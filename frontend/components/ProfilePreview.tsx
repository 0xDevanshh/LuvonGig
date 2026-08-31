import React, { memo, useMemo } from 'react'
import { SkillTag } from './skillTag'
interface ProfilePreviewProps {
  name?: string
  firstName?: string
  lastName?: string
  bio?: string
  skills?: string[]
  location?: string
  phone?: string
  website?: string
  linkedin?: string
  github?: string
  twitter?: string
  hasResume?: boolean
  profileImage?: string | null
}
const ProfilePreview = memo(function ProfilePreview({
  name,
  firstName,
  lastName,
  bio,
  skills = [],
  location,
  phone,
  website,
  linkedin,
  github,
  twitter,
  hasResume = false,
  profileImage,
}: ProfilePreviewProps) {
  // Generate display name from firstName and lastName if name is not provided
  const displayName = useMemo(() =>
    name || (firstName && lastName ? `${firstName} ${lastName}` : 'Your Name'),
    [name, firstName, lastName]
  );

  // Memoize skills array to prevent unnecessary re-renders
  const memoizedSkills = useMemo(() => skills, [skills]);

  // Memoize social links object
  const socialLinks = useMemo(() => ({
    linkedin,
    github,
    twitter
  }), [linkedin, github, twitter]);
  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 relative overflow-hidden">
      {/* Gradient background effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50 via-white to-blue-50 opacity-20"></div>
      <div className="relative z-10">
        {/* Profile Image */}
        <div className="flex justify-center mb-6">
          {profileImage ? (
            <img
              src={profileImage}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
          )}
        </div>
        {/* Name */}
        <h2 className="text-3xl font-bold text-center text-[#161616] mb-4">
          {displayName}
        </h2>

        {/* Bio */}
        {bio && (
          <p className="text-gray-600 text-center mb-6 line-clamp-3">
            {bio}
          </p>
        )}
        {/* Availability */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 relative">
              <div className="w-full h-full rounded-full bg-[#2ba24c]"></div>
            </div>
            <span className="text-gray-700">Available for work</span>
          </div>
        </div>
        {/* Skills */}
        <div className="mb-6">
          <h3 className="uppercase text-gray-500 text-xs font-medium mb-3">
            SKILLS
          </h3>
          <div className="flex flex-wrap gap-2">
            {memoizedSkills.map((skill, index) => (
              <SkillTag
                key={`${skill}-${index}`}
                skill={skill}
                removable={false}
                className="bg-white"
              />
            ))}
          </div>
        </div>
        {/* Location */}
        {location && (
          <div className="mb-6">
            <h3 className="uppercase text-gray-500 text-xs font-medium mb-3">
              LOCATION
            </h3>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{location}</span>
            </div>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div className="mb-6">
            <h3 className="uppercase text-gray-500 text-xs font-medium mb-3">
              PHONE
            </h3>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>{phone}</span>
            </div>
          </div>
        )}

        {/* Website */}
        {website && (
          <div className="mb-6">
            <h3 className="uppercase text-gray-500 text-xs font-medium mb-3">
              WEBSITE
            </h3>
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline truncate"
              >
                {website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          </div>
        )}

        {/* Social Links */}
        {(socialLinks.linkedin || socialLinks.github || socialLinks.twitter) && (
          <div className="mb-6">
            <h3 className="uppercase text-gray-500 text-xs font-medium mb-3">
              SOCIAL
            </h3>
            <div className="flex gap-3">
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:text-blue-800"
                  title="LinkedIn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 hover:text-gray-900"
                  title="GitHub"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-500"
                  title="Twitter"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Resume */}
        <div>
          <h3 className="uppercase text-gray-500 text-xs font-medium mb-3">
            RESUME
          </h3>
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            {hasResume ? (
              <span className="text-gray-700">Resume.pdf</span>
            ) : (
              <span className="text-gray-400">No resume uploaded</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
});

export { ProfilePreview }
