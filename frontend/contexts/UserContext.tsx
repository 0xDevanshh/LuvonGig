'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  designation?: string;
  profileImage?: string;
  isClient?: boolean;
  isFreelancer?: boolean;
  isAdmin?: boolean;
  isLoaded: boolean;
}

interface UserContextType {
  profile: UserProfile;
  isLoading: boolean;
  currentRole: 'client' | 'freelancer' | 'admin' | 'expert' | 'both';
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({
    firstName: '',
    lastName: '',
    email: '',
    designation: 'Client',
    isClient: false,
    isFreelancer: false,
    isAdmin: false,
    profileImage: '',
    isLoaded: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();

  // Determine current role based on route
  const getCurrentRole = (): 'client' | 'freelancer' | 'admin' | 'expert' | 'both' => {
    if (pathname.startsWith('/admin')) {
      return 'admin';
    } else if (pathname.startsWith('/freelancer')) {
      return 'freelancer';
    } else if (pathname.startsWith('/expert')) {
      return 'expert';
    } else if (pathname.startsWith('/client')) {
      return 'client';
    } else {
      // Check user's actual roles if not in a specific route
      if (profile.isClient && profile.isFreelancer) {
        return 'both';
      } else if (profile.isFreelancer) {
        return 'freelancer';
      } else if (profile.isAdmin) {
        return 'admin';
      } else {
        return 'client'; // default
      }
    }
  };

  const currentRole = getCurrentRole();

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

          // Check if user is an expert (from Postgres)
          const expertResponse = await fetch('/api/expert/register');
          const expertData = await expertResponse.json();
          const isExpertProfile = expertData.expert !== null;

          // Determine user roles based on profile and route
          const isClientRoute = pathname.startsWith('/client');
          const isFreelancerRoute = pathname.startsWith('/freelancer');
          const isExpertRoute = pathname.startsWith('/expert');
          const isAdminRoute = pathname.startsWith('/admin');

          // Get skills and profile completion info
          const skills = profileData.profile?.skills || [];
          const hasResume = profileData.profile?.hasResume || false;
          const bio = profileData.profile?.bio?.toLowerCase() || '';

          // Determine if user has freelancer-like characteristics
          const hasFreelancerProfile = skills.length > 0 || hasResume ||
            bio.includes('freelancer') || bio.includes('available for work');

          const designation = getUserDesignation(profileData.profile) || 'Client';

          setProfile({
            firstName: profileData.profile?.firstName || '',
            lastName: profileData.profile?.lastName || '',
            email: profileData.profile?.email || sessionData.email || '',
            designation: isExpertProfile ? 'Expert' : designation,
            profileImage: profileData.profile?.profileImage || expertData.expert?.picture_url || '',
            isClient: isClientRoute || (!hasFreelancerProfile && !isExpertProfile),
            isFreelancer: isFreelancerRoute || hasFreelancerProfile,
            isAdmin: isAdminRoute,
            isLoaded: true,
          });
        } else {
          // Fallback to session data only
          const isClientRoute = pathname.startsWith('/client');
          const isFreelancerRoute = pathname.startsWith('/freelancer');
          const isAdminRoute = pathname.startsWith('/admin');

          setProfile({
            firstName: '',
            lastName: '',
            email: sessionData.email || '',
            designation: isClientRoute ? 'Client' : isFreelancerRoute ? 'Freelancer' : 'Admin',
            profileImage: '',
            isClient: isClientRoute || (!isFreelancerRoute && !isAdminRoute),
            isFreelancer: isFreelancerRoute,
            isAdmin: isAdminRoute,
            isLoaded: true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set default profile on error
      const isClientRoute = pathname.startsWith('/client');
      const isFreelancerRoute = pathname.startsWith('/freelancer');
      const isAdminRoute = pathname.startsWith('/admin');

      setProfile({
        firstName: '',
        lastName: '',
        email: '',
        designation: isClientRoute ? 'Client' : isFreelancerRoute ? 'Freelancer' : 'Admin',
        profileImage: '',
        isClient: isClientRoute || (!isFreelancerRoute && !isAdminRoute),
        isFreelancer: isFreelancerRoute,
        isAdmin: isAdminRoute,
        isLoaded: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    setIsLoading(true);
    await fetchUserProfile();
  };

  useEffect(() => {
    fetchUserProfile();
  }, [pathname]); // Refetch when route changes

  const value: UserContextType = {
    profile,
    isLoading,
    currentRole,
    refreshProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
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