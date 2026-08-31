interface ProfileData {
  firstName: string;
  lastName: string;
  bio: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
  twitter: string;
  profileImage?: string | null;
}

interface AddressData {
  isPrivate: boolean;
  country: string;
  state: string;
  city: string;
  zipCode: string;
  streetAddress: string;
}

interface ResumeData {
  fileName: string;
  file: File | null;
  fileUrl?: string;
  hasResume: boolean;
}

interface OnboardingSessionData {
  profile: ProfileData;
  address: AddressData;
  skills: string[];
  resume: ResumeData;
  completedSteps: number[];
}

const SESSION_KEY = 'onboarding_session_data';

// Helper function to check if we're in the browser
const isBrowser = (): boolean => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const defaultProfile: ProfileData = {
  firstName: '',
  lastName: '',
  bio: '',
  phone: '',
  location: '',
  website: '',
  linkedin: '',
  github: '',
  twitter: '',
  profileImage: null,
};

const defaultAddress: AddressData = {
  isPrivate: true,
  country: 'US',
  state: '',
  city: '',
  zipCode: '',
  streetAddress: '',
};

const defaultResume: ResumeData = {
  fileName: '',
  file: null,
  hasResume: false,
};

const defaultSessionData: OnboardingSessionData = {
  profile: defaultProfile,
  address: defaultAddress,
  skills: [],
  resume: defaultResume,
  completedSteps: [],
};

// Session storage utilities
export const onboardingSession = {
  // Load data from session storage
  load: (): OnboardingSessionData => {
    try {
      if (!isBrowser()) {
        console.log('🔄 Server-side: using default session data');
        return defaultSessionData;
      }
      console.log('🔄 Loading onboarding session data...');
      const sessionData = sessionStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        console.log('📥 Loaded session data:', parsed);
        return { ...defaultSessionData, ...parsed };
      } else {
        console.log('📭 No session data found, using defaults');
        return defaultSessionData;
      }
    } catch (error) {
      console.error('❌ Error loading session data:', error);
      return defaultSessionData;
    }
  },

  // Save data to session storage
  save: (data: Partial<OnboardingSessionData>): void => {
    try {
      if (!isBrowser()) {
        console.log('🔄 Server-side: skipping session storage save');
        return;
      }
      const currentData = onboardingSession.load();
      const newData = { ...currentData, ...data };
      console.log('💾 Saving session data:', newData);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(newData));
      console.log('✅ Session data saved successfully');
    } catch (error) {
      console.error('❌ Error saving session data:', error);
    }
  },

  // Update profile data
  updateProfile: (profileUpdate: Partial<ProfileData>): void => {
    console.log('🔄 Updating profile in session:', profileUpdate);
    const currentData = onboardingSession.load();
    const updatedProfile = { ...currentData.profile, ...profileUpdate };
    onboardingSession.save({ profile: updatedProfile });
    console.log('📊 Updated profile:', updatedProfile);
  },

  // Update address data
  updateAddress: (addressUpdate: Partial<AddressData>): void => {
    console.log('🔄 Updating address in session:', addressUpdate);
    const currentData = onboardingSession.load();
    const updatedAddress = { ...currentData.address, ...addressUpdate };
    onboardingSession.save({ address: updatedAddress });
    console.log('📊 Updated address:', updatedAddress);
  },

  // Update skills data
  updateSkills: (skills: string[]): void => {
    console.log('🔄 Updating skills in session:', skills);
    onboardingSession.save({ skills });
    console.log('📊 Updated skills:', skills);
  },

  // Add a skill
  addSkill: (skill: string): boolean => {
    const currentData = onboardingSession.load();
    if (!currentData.skills.includes(skill) && currentData.skills.length < 20) {
      const newSkills = [...currentData.skills, skill];
      onboardingSession.updateSkills(newSkills);
      return true;
    }
    return false;
  },

  // Remove a skill
  removeSkill: (skill: string): void => {
    const currentData = onboardingSession.load();
    const newSkills = currentData.skills.filter(s => s !== skill);
    onboardingSession.updateSkills(newSkills);
  },

  // Update resume data
  updateResume: (resumeUpdate: Partial<ResumeData>): void => {
    console.log('🔄 Updating resume in session:', resumeUpdate);
    const currentData = onboardingSession.load();
    const updatedResume = { ...currentData.resume, ...resumeUpdate };
    onboardingSession.save({ resume: updatedResume });
    console.log('📊 Updated resume:', updatedResume);
  },

  // Mark step as completed
  markStepCompleted: (step: number): void => {
    console.log(`✅ Marking step ${step} as completed`);
    const currentData = onboardingSession.load();
    if (!currentData.completedSteps.includes(step)) {
      const updatedSteps = [...currentData.completedSteps, step];
      onboardingSession.save({ completedSteps: updatedSteps });
      console.log('📊 Completed steps:', updatedSteps);
    }
  },

  // Check if step is completed
  isStepCompleted: (step: number): boolean => {
    const currentData = onboardingSession.load();
    return currentData.completedSteps.includes(step);
  },

  // Get all accumulated data
  getAllData: (): OnboardingSessionData => {
    return onboardingSession.load();
  },

  // Clear all session data
  clear: (): void => {
    if (!isBrowser()) {
      console.log('🔄 Server-side: skipping session storage clear');
      return;
    }
    console.log('🗑️ Clearing onboarding session data');
    sessionStorage.removeItem(SESSION_KEY);
  },

  // Get formatted location
  getFormattedLocation: (): string => {
    const { address } = onboardingSession.load();
    const { streetAddress, city, state, zipCode, country } = address;
    const locationParts = [];
    
    if (streetAddress) locationParts.push(streetAddress);
    if (city) locationParts.push(city);
    if (state) locationParts.push(state);
    if (zipCode) locationParts.push(zipCode);
    if (country) locationParts.push(country);
    
    return locationParts.join(', ');
  },

  // Get full name
  getFullName: (): string => {
    const { profile } = onboardingSession.load();
    return `${profile.firstName} ${profile.lastName}`.trim();
  },

  // Validation helpers
  hasBasicProfile: (): boolean => {
    const { profile } = onboardingSession.load();
    return !!(profile.firstName && profile.lastName);
  },

  hasCompleteAddress: (): boolean => {
    const { address } = onboardingSession.load();
    return !!(address.city && address.state && address.zipCode);
  },

  hasSkills: (): boolean => {
    const { skills } = onboardingSession.load();
    return skills.length > 0;
  },

  // Debug function
  debug: (): void => {
    const data = onboardingSession.load();
    console.log('🔍 Onboarding Session Debug:');
    console.log('📊 Profile:', data.profile);
    console.log('📊 Address:', data.address);
    console.log('📊 Skills:', data.skills);
    console.log('📊 Resume:', data.resume);
    console.log('📊 Completed Steps:', data.completedSteps);
    console.log('📊 Computed Values:');
    console.log('  • Full Name:', onboardingSession.getFullName());
    console.log('  • Formatted Location:', onboardingSession.getFormattedLocation());
    console.log('  • Has Basic Profile:', onboardingSession.hasBasicProfile());
    console.log('  • Has Complete Address:', onboardingSession.hasCompleteAddress());
    console.log('  • Has Skills:', onboardingSession.hasSkills());
  }
};
