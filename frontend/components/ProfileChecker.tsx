'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProfileCompleteness {
  success: boolean;
  isComplete: boolean;
  profileSubmitted?: boolean;
  requiredFields?: string[];
  optionalFields?: string[];
  message: string;
  fallback?: boolean;
}

export default function ProfileChecker({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkProfileCompleteness = async () => {
      try {
        // Check if user just completed onboarding by checking localStorage
        const onboardingCompleted = localStorage.getItem('onboarding_completed');
        if (onboardingCompleted === 'true') {
          setIsChecking(false);
          return;
        }

        const response = await fetch('/api/profile/check-completeness');
        const result: ProfileCompleteness = await response.json();

        // Only redirect to onboarding if profile is incomplete AND not submitted AND not a fallback
        if (result.success && !result.isComplete && !result.profileSubmitted && !result.fallback) {
          // Redirect to onboarding if profile is incomplete and not submitted
          router.push('/onboarding');
        }
      } catch (error) {
        console.error('Error checking profile completeness:', error);
        // If there's an error, don't block the user - let them continue
      } finally {
        setIsChecking(false);
      }
    };

    checkProfileCompleteness();
  }, [router]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your profile...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}