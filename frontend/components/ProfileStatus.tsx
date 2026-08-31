'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock, User } from 'lucide-react';

interface ProfileStatusData {
  isComplete: boolean;
  profileSubmitted: boolean;
  message: string;
  completionPercentage?: number;
  missingFields?: string[];
  userEmail?: string;
  details?: {
    hasBasicInfo: boolean;
    hasContactInfo: boolean;
    hasLocation: boolean;
    hasSkills: boolean;
    hasResume: boolean;
    hasBio: boolean;
  };
}

export default function ProfileStatus() {
  const [profileStatus, setProfileStatus] = useState<ProfileStatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileStatus = async () => {
      try {
        const response = await fetch('/api/profile/check-completeness');
        const result = await response.json();

        if (result.success) {
          setProfileStatus({
            isComplete: result.isComplete,
            profileSubmitted: result.profileSubmitted || false,
            message: result.message,
            completionPercentage: result.completionPercentage,
            missingFields: result.missingFields,
            userEmail: result.userEmail,
            details: result.details,
          });
        } else {
          // Handle backend unavailable or other errors
          setProfileStatus({
            isComplete: false,
            profileSubmitted: false,
            message: result.message || 'Unable to check profile status',
            completionPercentage: 0,
            missingFields: ['Backend unavailable'],
            userEmail: result.userEmail,
            details: {
              hasBasicInfo: false,
              hasContactInfo: false,
              hasLocation: false,
              hasSkills: false,
              hasResume: false,
              hasBio: false
            }
          });
        }
      } catch (error) {
        console.error('Error fetching profile status:', error);
        // Set error state when API call fails
        setProfileStatus({
          isComplete: false,
          profileSubmitted: false,
          message: 'Failed to check profile status. Please try again.',
          completionPercentage: 0,
          missingFields: ['Network error'],
          userEmail: '',
          details: {
            hasBasicInfo: false,
            hasContactInfo: false,
            hasLocation: false,
            hasSkills: false,
            hasResume: false,
            hasBio: false
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!profileStatus) {
    return null;
  }

  const { isComplete, profileSubmitted, message, completionPercentage, missingFields, userEmail, details } = profileStatus;

  const getStatusIcon = () => {
    if (profileSubmitted) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    } else if (isComplete) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    } else {
      return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (profileSubmitted) {
      return 'border-green-200 bg-green-50';
    } else if (isComplete) {
      return 'border-yellow-200 bg-yellow-50';
    } else {
      return 'border-gray-200 bg-white';
    }
  };

  const getStatusText = () => {
    if (profileSubmitted) {
      return 'Profile Active';
    } else if (isComplete) {
      return 'Profile Complete';
    } else if (missingFields?.includes('Backend unavailable')) {
      return 'Backend Unavailable';
    } else if (missingFields?.includes('Network error')) {
      return 'Connection Error';
    } else if (missingFields?.includes('Authentication required')) {
      return 'Please Log In';
    } else if (missingFields?.includes('Backend connection issue')) {
      return 'Connection Issue';
    } else {
      return 'Profile Incomplete';
    }
  };

  const getStatusDescription = () => {
    if (profileSubmitted) {
      return 'Your profile is active and ready to use! You can now apply for opportunities and participate in the platform.';
    } else if (isComplete) {
      return 'Your profile is complete and will be automatically activated.';
    } else if (missingFields?.includes('Backend unavailable')) {
      return 'Unable to connect to the backend. Please try again later.';
    } else if (missingFields?.includes('Network error')) {
      return 'Network connection failed. Please check your internet connection.';
    } else if (missingFields?.includes('Authentication required')) {
      return 'Please log in to view your profile status and complete your profile.';
    } else if (missingFields?.includes('Backend connection issue')) {
      return 'There was an issue connecting to the backend. Please try again later.';
    } else {
      return 'Complete your profile to unlock all features and opportunities.';
    }
  };

  return (
    <div className={`rounded-lg border p-4 transition-colors ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getStatusIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-900">
              {getStatusText()}
            </h3>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {getStatusDescription()}
          </p>
          <p className="text-xs text-gray-500 mb-3">
            {message}
          </p>

          {/* Progress Bar */}
          {completionPercentage !== undefined && (
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-600">Profile Completion</span>
                <span className="text-xs font-medium text-gray-700">{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Detailed Status */}
          {details && (
            <div className="mb-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`flex items-center gap-1 ${details.hasBasicInfo ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Basic Info</span>
                </div>
                <div className={`flex items-center gap-1 ${details.hasContactInfo ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Contact</span>
                </div>
                <div className={`flex items-center gap-1 ${details.hasLocation ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Location</span>
                </div>
                <div className={`flex items-center gap-1 ${details.hasSkills ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Skills</span>
                </div>
                <div className={`flex items-center gap-1 ${details.hasResume ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Resume</span>
                </div>
                <div className={`flex items-center gap-1 ${details.hasBio ? 'text-green-600' : 'text-gray-400'}`}>
                  <CheckCircle className="w-3 h-3" />
                  <span>Bio</span>
                </div>
              </div>
            </div>
          )}

          {/* Missing Fields */}
          {missingFields && missingFields.length > 0 && (
            <div className="mb-3">
              <p className="text-xs text-gray-600 mb-1">Missing fields:</p>
              <div className="flex flex-wrap gap-1">
                {missingFields.map((field, index) => (
                  <span key={index} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    {field}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* User Email (for debugging) */}
          {userEmail && (
            <p className="text-xs text-gray-400">
              User: {userEmail}
            </p>
          )}

          {!profileSubmitted && isComplete && (
            <div className="mt-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-sm font-medium rounded-md">
                <Clock className="w-4 h-4" />
                <span>Profile will be activated automatically</span>
              </div>
            </div>
          )}

          {!isComplete && !missingFields?.includes('Backend unavailable') && !missingFields?.includes('Network error') && (
            <div className="mt-3">
              <button
                onClick={() => window.location.href = '/onboarding'}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Complete Profile
                <User className="w-4 h-4" />
              </button>
            </div>
          )}

          {(missingFields?.includes('Backend unavailable') || missingFields?.includes('Network error')) && (
            <div className="mt-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
              >
                Retry Connection
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}

          {missingFields?.includes('Authentication required') && (
            <div className="mt-3">
              <button
                onClick={() => window.location.href = '/login'}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Log In
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}

          {missingFields?.includes('Backend connection issue') && (
            <div className="mt-3">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 transition-colors"
              >
                Retry Connection
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}