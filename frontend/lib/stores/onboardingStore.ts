import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface OnboardingState {
  // Data
  profile: ProfileData;
  address: AddressData;
  skills: string[];
  resume: ResumeData;
  
  // UI State
  isLoading: boolean;
  error: string;
  
  // Actions
  updateProfile: (profile: Partial<ProfileData>) => void;
  updateAddress: (address: Partial<AddressData>) => void;
  updateSkills: (skills: string[]) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  updateResume: (resume: Partial<ResumeData>) => void;
  setError: (error: string) => void;
  setLoading: (loading: boolean) => void;
  clearData: () => void;
  
  // Computed values
  getFullName: () => string;
  getFormattedLocation: () => string;
  hasBasicProfile: () => boolean;
  hasCompleteAddress: () => boolean;
  hasSkills: () => boolean;
}

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

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      // Initial state
      profile: defaultProfile,
      address: defaultAddress,
      skills: [],
      resume: defaultResume,
      isLoading: false,
      error: '',

      // Actions
      updateProfile: (profileUpdate) => {
        console.log('🔄 Zustand: Updating profile:', profileUpdate);
        set((state) => ({
          profile: { ...state.profile, ...profileUpdate },
        }));
        console.log('📊 Zustand: New profile state:', get().profile);
      },

      updateAddress: (addressUpdate) => {
        console.log('🔄 Zustand: Updating address:', addressUpdate);
        set((state) => ({
          address: { ...state.address, ...addressUpdate },
        }));
        console.log('📊 Zustand: New address state:', get().address);
      },

      updateSkills: (skills) => {
        console.log('🔄 Zustand: Updating skills:', skills);
        set({ skills });
        console.log('📊 Zustand: New skills state:', get().skills);
      },

      addSkill: (skill) => {
        const currentSkills = get().skills;
        if (!currentSkills.includes(skill) && currentSkills.length < 20) {
          const newSkills = [...currentSkills, skill];
          console.log('🔄 Zustand: Adding skill:', skill);
          set({ skills: newSkills });
          console.log('📊 Zustand: New skills state:', get().skills);
        }
      },

      removeSkill: (skill) => {
        const currentSkills = get().skills;
        const newSkills = currentSkills.filter(s => s !== skill);
        console.log('🔄 Zustand: Removing skill:', skill);
        set({ skills: newSkills });
        console.log('📊 Zustand: New skills state:', get().skills);
      },

      updateResume: (resumeUpdate) => {
        console.log('🔄 Zustand: Updating resume:', resumeUpdate);
        set((state) => ({
          resume: { ...state.resume, ...resumeUpdate },
        }));
        console.log('📊 Zustand: New resume state:', get().resume);
      },

      setError: (error) => set({ error }),
      setLoading: (isLoading) => set({ isLoading }),
      
      clearData: () => {
        console.log('🗑️ Zustand: Clearing all data');
        set({
          profile: defaultProfile,
          address: defaultAddress,
          skills: [],
          resume: defaultResume,
          error: '',
          isLoading: false,
        });
      },

      // Computed values
      getFullName: () => {
        const { firstName, lastName } = get().profile;
        return `${firstName} ${lastName}`.trim();
      },

      getFormattedLocation: () => {
        const { streetAddress, city, state, zipCode, country } = get().address;
        const locationParts = [];
        
        if (streetAddress) locationParts.push(streetAddress);
        if (city) locationParts.push(city);
        if (state) locationParts.push(state);
        if (zipCode) locationParts.push(zipCode);
        if (country) locationParts.push(country);
        
        return locationParts.join(', ');
      },

      hasBasicProfile: () => {
        const { firstName, lastName } = get().profile;
        return !!(firstName && lastName);
      },

      hasCompleteAddress: () => {
        const { city, state, zipCode } = get().address;
        return !!(city && state && zipCode);
      },

      hasSkills: () => {
        return get().skills.length > 0;
      },
    }),
    {
      name: 'onboarding-storage', // unique name for localStorage key
      partialize: (state) => ({
        profile: state.profile,
        address: state.address,
        skills: state.skills,
        resume: state.resume,
      }),
    }
  )
);

// Debug function to log current state
export const debugOnboardingState = () => {
  const state = useOnboardingStore.getState();
  console.log('🔍 Zustand Debug - Current State:');
  console.log('📊 Profile:', state.profile);
  console.log('📊 Address:', state.address);
  console.log('📊 Skills:', state.skills);
  console.log('📊 Resume:', state.resume);
  console.log('📊 Computed Values:');
  console.log('  • Full Name:', state.getFullName());
  console.log('  • Formatted Location:', state.getFormattedLocation());
  console.log('  • Has Basic Profile:', state.hasBasicProfile());
  console.log('  • Has Complete Address:', state.hasCompleteAddress());
  console.log('  • Has Skills:', state.hasSkills());
};
