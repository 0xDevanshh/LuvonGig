'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboardingStore, debugOnboardingState } from '@/lib/stores/onboardingStore';

export function useOnboardingZustand() {
  const router = useRouter();
  const {
    profile,
    address,
    skills,
    resume,
    isLoading,
    error,
    updateProfile,
    updateAddress,
    updateSkills,
    addSkill,
    removeSkill,
    updateResume,
    setError,
    setLoading,
    clearData,
    getFullName,
    getFormattedLocation,
    hasBasicProfile,
    hasCompleteAddress,
    hasSkills,
  } = useOnboardingStore();

  // Save to API
  const saveToAPI = useCallback(async (step: number) => {
    setError('');
    setLoading(true);
    
    try {
      let endpoint = '';
      let payload = {};

      switch (step) {
        case 2: // Profile
          endpoint = '/api/profile/complete';
          payload = profile;
          console.log('💾 Zustand: Saving Profile to API:', endpoint, payload);
          break;
        case 3: // Address
          endpoint = '/api/onboarding/address';
          payload = address;
          console.log('💾 Zustand: Saving Address to API:', endpoint, payload);
          break;
        case 4: // Skills
          endpoint = '/api/onboarding/skills';
          payload = { skills };
          console.log('💾 Zustand: Saving Skills to API:', endpoint, payload);
          break;
        case 5: // Resume - Save complete onboarding data
          endpoint = '/api/onboarding/complete';
          payload = {
            profile,
            skills,
            resume,
            address,
          };
          console.log('💾 Zustand: Saving Complete Onboarding to API:', endpoint);
          console.log('📦 Zustand: Complete Payload:', payload);
          break;
        default:
          return true;
      }

      if (endpoint && Object.keys(payload).length > 0) {
        console.log(`🚀 Zustand: Making API request to: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log(`📡 Zustand: API Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
          const result = await response.json();
          console.error('❌ Zustand: API Error Response:', result);
          throw new Error(result.error || 'Failed to save data');
        }

        const result = await response.json();
        console.log('✅ Zustand: API Success Response:', result);
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ Zustand: API Save Error:', errorMessage);
      console.error('❌ Zustand: Full Error:', err);
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile, address, skills, resume, setError, setLoading]);

  // Navigate to next step
  const goToNextStep = useCallback(async (currentStep: number) => {
    // Check if we can access the next step (prerequisites)
    const nextStep = currentStep + 1;
    if (nextStep <= 5) {
      // Check prerequisites
      let canProceed = true;
      if (nextStep === 3 && !hasBasicProfile()) {
        setError('Please complete your profile first');
        canProceed = false;
      } else if (nextStep === 4 && !hasCompleteAddress()) {
        setError('Please complete your address first');
        canProceed = false;
      }

      if (!canProceed) {
        return false;
      }
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
  }, [saveToAPI, router, hasBasicProfile, hasCompleteAddress, setError]);

  // Navigate to previous step
  const goToPreviousStep = useCallback((currentStep: number) => {
    const previousStep = currentStep - 1;
    const routes = ['', 'profile', 'address', 'skills', 'resume'];

    if (previousStep >= 1) {
      router.push(`/onboarding/${routes[previousStep - 1]}`);
    }
  }, [router]);

  // Complete onboarding and save all data
  const completeOnboarding = useCallback(async () => {
    setError('');
    setLoading(true);

    try {
      // Validate data before sending to canister
      console.log('🔍 Zustand: Validating data before canister save...');
      debugOnboardingState();
      
      // Check if critical data is missing
      const missingData = [];
      if (!profile.firstName) missingData.push('firstName');
      if (!profile.lastName) missingData.push('lastName');
      if (!address.city) missingData.push('address.city');
      if (!address.state) missingData.push('address.state');
      if (!address.zipCode) missingData.push('address.zipCode');
      if (skills.length === 0) missingData.push('skills');
      
      if (missingData.length > 0) {
        console.error('❌ Zustand: Missing critical data:', missingData);
        throw new Error(`Missing required data: ${missingData.join(', ')}`);
      }
      
      console.log('✅ Zustand: Data validation passed');

      // Log the complete onboarding flow being saved to canister
      console.log('=== ZUSTAND: COMPLETE ONBOARDING FLOW SAVING TO CANISTER ===');
      console.log('📤 User Profile Data:');
      console.log('  • Name:', getFullName() || 'Not provided');
      console.log('  • Bio:', profile.bio || 'Not provided');
      console.log('  • Phone:', profile.phone || 'Not provided');
      console.log('  • Location:', profile.location || 'Not provided');
      console.log('  • Website:', profile.website || 'Not provided');
      console.log('  • LinkedIn:', profile.linkedin || 'Not provided');
      console.log('  • GitHub:', profile.github || 'Not provided');
      console.log('  • Twitter:', profile.twitter || 'Not provided');
      console.log('  • Profile Image:', profile.profileImage ? '✓ Uploaded' : 'Not uploaded');

      console.log('🎯 Skills & Expertise:');
      if (skills.length > 0) {
        console.log(`  • ${skills.length} skills:`, skills.join(', '));
      } else {
        console.log('  • No skills added');
      }

      console.log('📍 Address Information:');
      console.log('  • Country:', address.country);
      console.log('  • State:', address.state);
      console.log('  • City:', address.city);
      console.log('  • ZIP Code:', address.zipCode);
      console.log('  • Street Address:', address.streetAddress || 'Not provided');
      console.log('  • Private Profile:', address.isPrivate ? 'Yes' : 'No');

      console.log('📄 Resume Information:');
      if (resume.hasResume) {
        console.log('  • Resume:', '✓ Uploaded');
        console.log('  • File Name:', resume.fileName || 'Unknown');
        console.log('  • File URL:', resume.fileUrl || 'No URL');
      } else {
        console.log('  • Resume: Not uploaded (optional)');
      }

      console.log('📊 Onboarding Summary:');
      console.log('  • Basic Profile:', hasBasicProfile() ? '✓ Complete' : '✗ Incomplete');
      console.log('  • Complete Address:', hasCompleteAddress() ? '✓ Complete' : '✗ Incomplete');
      console.log('  • Skills Added:', hasSkills() ? '✓ Complete' : '✗ Incomplete');
      console.log('=========================================================');

      // Save complete onboarding data to canister
      const endpoint = '/api/onboarding/complete';
      const payload = {
        profile,
        skills,
        resume,
        address,
      };

      console.log('🚀 Zustand: Sending payload to canister via API:', endpoint);
      console.log('📦 Zustand: Payload structure:', {
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
      console.log('✅ Zustand: Onboarding completed successfully!');
      console.log('📋 Zustand: Canister response:', result);
      console.log('🎉 Zustand: User has completed the full onboarding flow and data is now saved to the canister!');

      // Mark onboarding as completed
      localStorage.setItem('onboarding_completed', 'true');

      // Clear onboarding data
      clearData();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ Zustand: Onboarding completion failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [profile, address, skills, resume, getFullName, hasBasicProfile, hasCompleteAddress, hasSkills, setError, setLoading, clearData]);

  // Reset onboarding completion (useful for logout)
  const resetOnboardingCompletion = useCallback(() => {
    localStorage.removeItem('onboarding_completed');
  }, []);

  return {
    // Data
    profile,
    address,
    skills,
    resume,
    fullLocation: getFormattedLocation(),
    fullName: getFullName(),
    
    // UI State
    isLoading,
    error,
    
    // Computed values
    hasBasicProfile: hasBasicProfile(),
    hasCompleteAddress: hasCompleteAddress(),
    hasSkills: hasSkills(),
    
    // Actions
    updateProfile,
    updateAddress,
    updateSkills,
    addSkill,
    removeSkill,
    updateResume,
    setError,
    goToNextStep,
    goToPreviousStep,
    clearData,
    completeOnboarding,
    resetOnboardingCompletion,
    
    // Debug functions
    debugState: debugOnboardingState,
  };
}
