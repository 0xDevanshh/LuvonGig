'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  designation?: string;
  profileImage?: string;
  bio: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  website: string;
  twitter: string;
  skills: string[];
  isLoaded: boolean;
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    designation: 'Client', // Default designation
    profileImage: '',
    bio: '',
    phone: '',
    location: '',
    github: '',
    linkedin: '',
    website: '',
    twitter: '',
    skills: [],
    isLoaded: false,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // First, get the current session to get email
        const sessionResponse = await fetch('/api/auth/me');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();

          // Then get the user's profile data
          const profileResponse = await fetch('/api/profile/check-completeness');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            const canisterProfile = profileData.profile || {};

            setProfile({
              firstName: canisterProfile.firstName || '',
              lastName: canisterProfile.lastName || '',
              email: sessionData.email || canisterProfile.email || '',
              designation: getUserDesignation(canisterProfile) || 'Client',
              profileImage: canisterProfile.profileImage || '',
              bio: canisterProfile.bio || '',
              phone: canisterProfile.phone || '',
              location: canisterProfile.location || '',
              github: canisterProfile.github || '',
              linkedin: canisterProfile.linkedin || '',
              website: canisterProfile.website || '',
              twitter: canisterProfile.twitter || '',
              skills: Array.isArray(canisterProfile.skills) ? canisterProfile.skills : [],
              isLoaded: true,
            });
          } else {
            // Fallback to session data only
            setProfile({
              firstName: '',
              lastName: '',
              email: sessionData.email || '',
              designation: 'Client',
              profileImage: '',
              bio: '',
              phone: '',
              location: '',
              github: '',
              linkedin: '',
              website: '',
              twitter: '',
              skills: [],
              isLoaded: true,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Set default profile on error
        setProfile({
          firstName: '',
          lastName: '',
          email: '',
          designation: 'Client',
          profileImage: '',
          bio: '',
          phone: '',
          location: '',
          github: '',
          linkedin: '',
          website: '',
          twitter: '',
          skills: [],
          isLoaded: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return { profile, isLoading };
}

// Helper function to determine user designation based on profile data
function getUserDesignation(profileData?: any): string {
  if (!profileData) return 'Client';

  const skills = profileData.skills || [];
  const bio = profileData.bio?.toLowerCase() || '';
  const hasResume = profileData.hasResume || profileData.resumeUrl;

  // Enhanced logic to determine designation based on skills and profile
  const technicalSkills = ['javascript', 'react', 'python', 'java', 'node.js', 'aws', 'docker', 'kubernetes', 'typescript', 'html', 'css', 'git', 'sql', 'mongodb'];
  const designSkills = ['figma', 'photoshop', 'illustrator', 'ui design', 'ux design', 'sketch', 'adobe xd'];
  const businessSkills = ['marketing', 'seo', 'content writing', 'project management', 'sales', 'leadership'];

  const userSkills = skills.map((skill: string) => skill.toLowerCase());

  const hasTechnicalSkills = technicalSkills.some((skill: string) => userSkills.some((userSkill: string) => userSkill.includes(skill)));
  const hasDesignSkills = designSkills.some((skill: string) => userSkills.some((userSkill: string) => userSkill.includes(skill)));
  const hasBusinessSkills = businessSkills.some((skill: string) => userSkills.some((userSkill: string) => userSkill.includes(skill)));

  // Determine designation based on skills count and type
  if (skills.length >= 10 || (hasTechnicalSkills && hasResume)) {
    return 'Expert';
  } else if (skills.length >= 5 || hasTechnicalSkills) {
    return 'Professional';
  } else if (skills.length >= 3 || hasDesignSkills || hasBusinessSkills) {
    return 'Freelancer';
  } else if (bio.includes('looking for work') || bio.includes('hiring') || bio.includes('job')) {
    return 'Job Seeker';
  } else if (bio.includes('client') || bio.includes('customer')) {
    return 'Client';
  } else if (skills.length > 0) {
    return 'Talent';
  } else {
    return 'Client'; // Default
  }
}