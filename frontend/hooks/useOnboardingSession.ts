'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { onboardingSession } from '@/lib/session/onboardingSession';

export function useOnboardingSession() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load initial data from session
  const [data, setData] = useState(() => onboardingSession.load());

  // Update local state when session data changes
  const refreshData = useCallback(() => {
    const sessionData = onboardingSession.load();
    setData(sessionData);
    return sessionData;
  }, []);

  // Update profile
  const updateProfile = useCallback((profileUpdate: any) => {
    onboardingSession.updateProfile(profileUpdate);
    refreshData();
  }, [refreshData]);

  // Update address
  const updateAddress = useCallback((addressUpdate: any) => {
    onboardingSession.updateAddress(addressUpdate);
    refreshData();
  }, [refreshData]);

  // Update skills
  const updateSkills = useCallback((skills: string[]) => {
    onboardingSession.updateSkills(skills);
    refreshData();
  }, [refreshData]);

  // Add skill
  const addSkill = useCallback((skill: string) => {
    const success = onboardingSession.addSkill(skill);
    if (success) {
      refreshData();
    }
    return success;
  }, [refreshData]);

  // Remove skill
  const removeSkill = useCallback((skill: string) => {
    onboardingSession.removeSkill(skill);
    refreshData();
  }, [refreshData]);

  // Update resume
  const updateResume = useCallback((resumeUpdate: any) => {
    onboardingSession.updateResume(resumeUpdate);
    refreshData();
  }, [refreshData]);

  // Navigate to next step (no API calls, just mark step as completed)
  const goToNextStep = useCallback(async (currentStep: number) => {
    console.log(`🔄 Moving from step ${currentStep} to step ${currentStep + 1}`);
    
    // Mark current step as completed
    onboardingSession.markStepCompleted(currentStep);
    refreshData();

    // Check prerequisites for next step
    const nextStep = currentStep + 1;
    if (nextStep <= 5) {
      let canProceed = true;
      
      if (nextStep === 3 && !onboardingSession.hasBasicProfile()) {
        setError('Please complete your profile first');
        canProceed = false;
      } else if (nextStep === 4 && !onboardingSession.hasCompleteAddress()) {
        setError('Please complete your address first');
        canProceed = false;
      }

      if (!canProceed) {
        return false;
      }
    }

    // Navigate to next step
    const routes = ['', 'profile', 'address', 'skills', 'resume'];
    if (nextStep <= 5) {
      router.push(`/onboarding/${routes[nextStep - 1]}`);
    } else {
      router.push('/onboarding/verification-complete');
    }

    return true;
  }, [router, refreshData]);

  // Navigate to previous step
  const goToPreviousStep = useCallback((currentStep: number) => {
    const previousStep = currentStep - 1;
    const routes = ['', 'profile', 'address', 'skills', 'resume'];

    if (previousStep >= 1) {
      router.push(`/onboarding/${routes[previousStep - 1]}`);
    }
  }, [router]);

  // Complete onboarding - save all data to canister in one go
  const completeOnboarding = useCallback(async () => {
    setError('');
    setIsLoading(true);

    try {
      // Get all accumulated data
      const allData = onboardingSession.getAllData();
      
      console.log('=== SESSION: COMPLETE ONBOARDING - SENDING ALL DATA TO CANISTER ===');
      console.log('📊 All accumulated data:', allData);
      
      // Validate data before sending to canister
      console.log('🔍 Validating complete data before canister save...');
      
      const missingData = [];
      if (!allData.profile.firstName) missingData.push('firstName');
      if (!allData.profile.lastName) missingData.push('lastName');
      if (!allData.address.city) missingData.push('address.city');
      if (!allData.address.state) missingData.push('address.state');
      if (!allData.address.zipCode) missingData.push('address.zipCode');
      if (allData.skills.length === 0) missingData.push('skills');
      
      if (missingData.length > 0) {
        console.error('❌ Missing critical data:', missingData);
        throw new Error(`Missing required data: ${missingData.join(', ')}`);
      }
      
      console.log('✅ Data validation passed');

      // Log detailed breakdown
      console.log('📤 User Profile Data:');
      console.log('  • Name:', `${allData.profile.firstName} ${allData.profile.lastName}`.trim());
      console.log('  • Bio:', allData.profile.bio || 'Not provided');
      console.log('  • Phone:', allData.profile.phone || 'Not provided');
      console.log('  • Location:', allData.profile.location || 'Not provided');
      console.log('  • Website:', allData.profile.website || 'Not provided');
      console.log('  • LinkedIn:', allData.profile.linkedin || 'Not provided');
      console.log('  • GitHub:', allData.profile.github || 'Not provided');
      console.log('  • Twitter:', allData.profile.twitter || 'Not provided');
      console.log('  • Profile Image:', allData.profile.profileImage ? '✓ Uploaded' : 'Not uploaded');

      console.log('🎯 Skills & Expertise:');
      console.log(`  • ${allData.skills.length} skills:`, allData.skills.join(', '));

      console.log('📍 Address Information:');
      console.log('  • Country:', allData.address.country);
      console.log('  • State:', allData.address.state);
      console.log('  • City:', allData.address.city);
      console.log('  • ZIP Code:', allData.address.zipCode);
      console.log('  • Street Address:', allData.address.streetAddress || 'Not provided');
      console.log('  • Private Profile:', allData.address.isPrivate ? 'Yes' : 'No');

      console.log('📄 Resume Information:');
      if (allData.resume.hasResume) {
        console.log('  • Resume:', '✓ Uploaded');
        console.log('  • File Name:', allData.resume.fileName || 'Unknown');
        console.log('  • File URL:', allData.resume.fileUrl || 'No URL');
      } else {
        console.log('  • Resume: Not uploaded (optional)');
      }

      console.log('📊 Completed Steps:', allData.completedSteps);
      console.log('=========================================================');

      // Send complete data to canister
      const endpoint = '/api/onboarding/complete';
      const payload = {
        profile: allData.profile,
        skills: allData.skills,
        resume: allData.resume,
        address: allData.address,
      };

      console.log('🚀 Sending complete payload to canister:', endpoint);
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

      console.log(`📡 Canister Response Status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const result = await response.json();
        console.error('❌ Canister Error Response:', result);
        throw new Error(result.error || 'Failed to complete onboarding');
      }

      const result = await response.json();
      console.log('✅ Onboarding completed successfully!');
      console.log('📋 Canister response:', result);
      console.log('🎉 All data successfully saved to canister!');

      // Mark onboarding as completed
      localStorage.setItem('onboarding_completed', 'true');

      // Clear session data
      onboardingSession.clear();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      console.error('❌ Onboarding completion failed:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    onboardingSession.clear();
    refreshData();
  }, [refreshData]);

  // Reset onboarding completion
  const resetOnboardingCompletion = useCallback(() => {
    localStorage.removeItem('onboarding_completed');
  }, []);

  // Debug function
  const debugData = useCallback(() => {
    onboardingSession.debug();
  }, []);

  // Computed values
  const fullLocation = onboardingSession.getFormattedLocation();
  const fullName = onboardingSession.getFullName();
  const hasBasicProfile = onboardingSession.hasBasicProfile();
  const hasCompleteAddress = onboardingSession.hasCompleteAddress();
  const hasSkills = onboardingSession.hasSkills();

  return {
    // Data
    profile: data.profile,
    address: data.address,
    skills: data.skills,
    resume: data.resume,
    fullLocation,
    fullName,
    
    // UI State
    isLoading,
    error,
    
    // Computed values
    hasBasicProfile,
    hasCompleteAddress,
    hasSkills,
    
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
    debugData,
    refreshData,
  };
}
