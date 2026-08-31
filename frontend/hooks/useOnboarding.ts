'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

interface OnboardingData {
  skills: string[];
  profile: ProfileData;
  address: AddressData;
  resume: ResumeData;
}

const DEFAULT_DATA: OnboardingData = {
  skills: [],
  profile: {
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
  },
  address: {
    isPrivate: true,
    country: 'US',
    state: '',
    city: '',
    zipCode: '',
    streetAddress: '',
  },
  resume: {
    fileName: '',
    file: null,
    hasResume: false,
  },
};

const STORAGE_KEY = 'onboarding_data';

export function useOnboarding() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      console.log('🔄 Loading data from localStorage...');
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('📥 Loaded data from localStorage:', parsedData);
        setData(prevData => ({ ...prevData, ...parsedData }));
      } else {
        console.log('📭 No data found in localStorage');
      }
    } catch (err) {
      console.error('❌ Error loading onboarding data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save data to localStorage with debouncing
  const saveToStorage = useCallback((newData: OnboardingData, immediate = false) => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const save = () => {
      setIsSaving(true);
      try {
        console.log('💾 Saving to localStorage:', STORAGE_KEY, newData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        console.log('✅ Successfully saved to localStorage');
      } catch (err) {
        console.error('❌ Error saving onboarding data:', err);
      } finally {
        setIsSaving(false);
      }
    };

    if (immediate) {
      save();
    } else {
      // Debounce save to avoid excessive localStorage writes
      debounceTimeoutRef.current = setTimeout(save, 500);
    }
  }, []);

  // Update skills
  const updateSkills = useCallback((skills: string[]) => {
    const newData = { ...data, skills };
    setData(newData);
    saveToStorage(newData);
  }, [data, saveToStorage]);

  // Add a skill
  const addSkill = useCallback((skill: string) => {
    if (!data.skills.includes(skill) && data.skills.length < 20) {
      updateSkills([...data.skills, skill]);
      return true;
    }
    return false;
  }, [data.skills, updateSkills]);

  // Remove a skill
  const removeSkill = useCallback((skill: string) => {
    updateSkills(data.skills.filter(s => s !== skill));
  }, [data.skills, updateSkills]);

  // Update profile
  const updateProfile = useCallback((profile: Partial<ProfileData>) => {
    console.log('🔄 Updating profile:', profile);
    console.log('📊 Current data before update:', data);
    
    const newData = {
      ...data,
      profile: { ...data.profile, ...profile }
    };
    
    console.log('📊 New data after update:', newData);
    setData(newData);
    saveToStorage(newData);
  }, [data, saveToStorage]);

  // Update address
  const updateAddress = useCallback((address: Partial<AddressData>) => {
    const newData = {
      ...data,
      address: { ...data.address, ...address }
    };
    setData(newData);
    saveToStorage(newData);
  }, [data, saveToStorage]);

  // Update resume
  const updateResume = useCallback((resume: Partial<ResumeData>) => {
    const newData = {
      ...data,
      resume: { ...data.resume, ...resume }
    };
    setData(newData);
    saveToStorage(newData);
  }, [data, saveToStorage]);

  // Get full location string for display
  const fullLocation = useMemo(() => {
    const { city, state, country } = data.address;
    const parts = [];
    if (city) parts.push(city);
    if (state) parts.push(state);
    if (country && country !== 'USA') parts.push(country);
    return parts.join(', ');
  }, [data.address.city, data.address.state, data.address.country]);

  // Get full name for display
  const fullName = useMemo(() => {
    const { firstName, lastName } = data.profile;
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return '';
  }, [data.profile.firstName, data.profile.lastName]);

  // Memoize computed values for performance
  const hasBasicProfile = useMemo(() => {
    return !!(data.profile.firstName && data.profile.lastName);
  }, [data.profile.firstName, data.profile.lastName]);

  const hasCompleteAddress = useMemo(() => {
    return !!(data.address.city && data.address.state && data.address.zipCode);
  }, [data.address.city, data.address.state, data.address.zipCode]);

  const hasSkills = useMemo(() => data.skills.length > 0, [data.skills.length]);

  // Memoize profile completion percentage
  const profileCompletionPercentage = useMemo(() => {
    let completed = 0;
    const total = 5;

    if (hasSkills) completed++;
    if (hasCompleteAddress) completed++;
    if (hasBasicProfile) completed++;
    if (data.profile.bio) completed++;
    if (data.profile.phone) completed++;

    return Math.round((completed / total) * 100);
  }, [hasSkills, hasCompleteAddress, hasBasicProfile, data.profile.bio, data.profile.phone]);

  // Check if step is complete
  const isStepComplete = useCallback((step: number) => {
    switch (step) {
      case 1: // Welcome (always complete)
        return true;
      case 2: // Profile
        return true; // Profile step is always accessible
      case 3: // Address
        return hasBasicProfile; // Address step requires basic profile
      case 4: // Skills
        return hasCompleteAddress;
      case 5: // Resume (optional)
        return true;
      default:
        return false;
    }
  }, [hasBasicProfile, hasCompleteAddress]);

  // Check if step can be accessed (prerequisites)
  const canAccessStep = useCallback((step: number) => {
    switch (step) {
      case 1: // Welcome (always accessible)
        return true;
      case 2: // Profile (always accessible)
        return true;
      case 3: // Address (requires basic profile)
        return hasBasicProfile;
      case 4: // Skills (requires complete address)
        return hasCompleteAddress;
      case 5: // Resume (always accessible)
        return true;
      default:
        return false;
    }
  }, [hasBasicProfile, hasCompleteAddress]);

  // Save to API
  const saveToAPI = useCallback(async (step: number) => {
    setError('');
    try {
      let endpoint = '';
      let payload = {};

      switch (step) {
        case 2: // Profile
          endpoint = '/api/profile/complete';
          payload = data.profile;
          console.log('💾 Saving Profile to API:', endpoint, payload);
          break;
        case 3: // Address
          endpoint = '/api/onboarding/address';
          payload = data.address;
          console.log('💾 Saving Address to API:', endpoint, payload);
          break;
        case 4: // Skills
          endpoint = '/api/onboarding/skills';
          payload = { skills: data.skills };
          console.log('💾 Saving Skills to API:', endpoint, payload);
          break;

        case 5: // Resume - Save complete onboarding data
          endpoint = '/api/onboarding/complete';
          payload = {
            profile: data.profile,
            skills: data.skills,
            resume: data.resume,
            address: data.address,
          };
          console.log('💾 Saving Complete Onboarding to API:', endpoint);
          console.log('📦 Complete Payload:', payload);
          break;
        default:
          return true;
      }

      if (endpoint && Object.keys(payload).length > 0) {
        console.log(`🚀 Making API request to: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log(`📡 API Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const result = await response.json();
          console.error('❌ API Error Response:', result);
          throw new Error(result.error || 'Failed to save data');
        }

        const result = await response.json();
        console.log('✅ API Success Response:', result);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ API Save Error:', errorMessage);
      console.error('❌ Full Error:', err);
      setError(errorMessage);
      return false;
    }
  }, [data]);

  // Navigate to next step
  const goToNextStep = useCallback(async (currentStep: number) => {
    // Check if we can access the next step (prerequisites)
    const nextStep = currentStep + 1;
    if (nextStep <= 5 && !canAccessStep(nextStep)) {
      setError('Please complete the current step before proceeding');
      return false;
    }

    const success = await saveToAPI(currentStep);
    if (!success) {
      return false;
    }

    const routes = ['', 'profile', 'address', 'skills', 'resume'];

    if (nextStep <= 5) {
      router.push(`/onboarding/${routes[nextStep - 1]}`);
    } else {
      router.push('/onboarding/verification-complete');
    }

    return true;
  }, [canAccessStep, saveToAPI, router]);

  // Navigate to previous step
  const goToPreviousStep = useCallback((currentStep: number) => {
    const previousStep = currentStep - 1;
    const routes = ['', 'profile', 'address', 'skills', 'resume'];

    if (previousStep >= 1) {
      router.push(`/onboarding/${routes[previousStep - 1]}`);
    }
  }, [router]);

  // Clear all data
  const clearData = useCallback(() => {
    setData(DEFAULT_DATA);
    localStorage.removeItem(STORAGE_KEY);
    // Clear debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // Don't remove onboarding_completed flag - it should persist
  }, []);

  // Complete onboarding and save all data
  const completeOnboarding = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      // Force immediate save before completing
      saveToStorage(data, true);

      // Validate data before sending to canister
      console.log('🔍 Validating data before canister save...');
      console.log('📊 Current data state:', data);
      
      // Check if critical data is missing
      const missingData = [];
      if (!data.profile.firstName) missingData.push('firstName');
      if (!data.profile.lastName) missingData.push('lastName');
      if (!data.address.city) missingData.push('address.city');
      if (!data.address.state) missingData.push('address.state');
      if (!data.address.zipCode) missingData.push('address.zipCode');
      if (data.skills.length === 0) missingData.push('skills');
      
      if (missingData.length > 0) {
        console.error('❌ Missing critical data:', missingData);
        throw new Error(`Missing required data: ${missingData.join(', ')}`);
      }
      
      console.log('✅ Data validation passed');

      // Log the complete onboarding flow being saved to canister
      console.log('=== COMPLETE ONBOARDING FLOW SAVING TO CANISTER ===');
      console.log('📤 User Profile Data:');
      console.log('  • Name:', `${data.profile.firstName} ${data.profile.lastName}`.trim() || 'Not provided');
      console.log('  • Bio:', data.profile.bio || 'Not provided');
      console.log('  • Phone:', data.profile.phone || 'Not provided');
      console.log('  • Location:', data.profile.location || 'Not provided');
      console.log('  • Website:', data.profile.website || 'Not provided');
      console.log('  • LinkedIn:', data.profile.linkedin || 'Not provided');
      console.log('  • GitHub:', data.profile.github || 'Not provided');
      console.log('  • Twitter:', data.profile.twitter || 'Not provided');
      console.log('  • Profile Image:', data.profile.profileImage ? '✓ Uploaded' : 'Not uploaded');

      console.log('🎯 Skills & Expertise:');
      if (data.skills.length > 0) {
        console.log(`  • ${data.skills.length} skills:`, data.skills.join(', '));
      } else {
        console.log('  • No skills added');
      }

      console.log('📍 Address Information:');
      console.log('  • Country:', data.address.country);
      console.log('  • State:', data.address.state);
      console.log('  • City:', data.address.city);
      console.log('  • ZIP Code:', data.address.zipCode);
      console.log('  • Street Address:', data.address.streetAddress || 'Not provided');
      console.log('  • Private Profile:', data.address.isPrivate ? 'Yes' : 'No');

      console.log('📄 Resume Information:');
      if (data.resume.hasResume) {
        console.log('  • Resume:', '✓ Uploaded');
        console.log('  • File Name:', data.resume.fileName || 'Unknown');
        console.log('  • File URL:', data.resume.fileUrl || 'No URL');
      } else {
        console.log('  • Resume: Not uploaded (optional)');
      }

      console.log('📊 Onboarding Summary:');
      console.log('  • Profile Completion:', profileCompletionPercentage + '%');
      console.log('  • Basic Profile:', hasBasicProfile ? '✓ Complete' : '✗ Incomplete');
      console.log('  • Complete Address:', hasCompleteAddress ? '✓ Complete' : '✗ Incomplete');
      console.log('  • Skills Added:', hasSkills ? '✓ Complete' : '✗ Incomplete');
      console.log('=========================================================');

      // Save complete onboarding data to canister
      const endpoint = '/api/onboarding/complete';
      const payload = {
        profile: data.profile,
        skills: data.skills,
        resume: data.resume,
        address: data.address,
      };

      console.log('🚀 Sending payload to canister via API:', endpoint);
      console.log('📦 Payload structure:', {
        profileFields: Object.keys(payload.profile).length,
        skillsCount: payload.skills.length,
        hasResume: payload.resume.hasResume,
        addressFields: Object.keys(payload.address).length,
      });

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to complete onboarding');
      }

      const result = await response.json();
      console.log('✅ Onboarding completed successfully!');
      console.log('📋 Canister response:', result);
      console.log('🎉 User has completed the full onboarding flow and data is now saved to the canister!');

      // Mark onboarding as completed
      localStorage.setItem('onboarding_completed', 'true');

      // Clear onboarding data from localStorage
      clearData();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ Onboarding completion failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [data, clearData, saveToStorage, profileCompletionPercentage, hasBasicProfile, hasCompleteAddress, hasSkills]);

  // Reset onboarding completion (useful for logout)
  const resetOnboardingCompletion = useCallback(() => {
    localStorage.removeItem('onboarding_completed');
  }, []);

  // Debug function to manually reload data from localStorage
  const reloadDataFromStorage = useCallback(() => {
    try {
      console.log('🔄 Manually reloading data from localStorage...');
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('📥 Reloaded data from localStorage:', parsedData);
        setData(parsedData);
        return parsedData;
      } else {
        console.log('📭 No data found in localStorage');
        return null;
      }
    } catch (err) {
      console.error('❌ Error reloading onboarding data:', err);
      return null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  // Memoized data object
  const memoizedData = useMemo(() => data, [data]);

  return {
    data: memoizedData,
    isLoading,
    isSaving,
    error,
    setError,
    skills: data.skills,
    profile: data.profile,
    address: data.address,
    resume: data.resume,
    fullLocation,
    fullName,
    hasBasicProfile,
    hasCompleteAddress,
    hasSkills,
    profileCompletionPercentage,
    updateSkills,
    addSkill,
    removeSkill,
    updateProfile,
    updateAddress,
    updateResume,
    isStepComplete,
    canAccessStep,
    goToNextStep,
    goToPreviousStep,
    clearData,
    completeOnboarding,
    resetOnboardingCompletion,
    reloadDataFromStorage,
  };
}