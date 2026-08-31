'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  AlertCircle,
  CheckCircle,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Settings,
  Trophy,
  UserCheck,
  Clock,
  Edit,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HackathonFormData } from '@/context/HackathonFormContext';

// Component to decode and validate URL parameters
function useHackathonData() {
  const searchParams = useSearchParams();
  const [hackathonData, setHackathonData] = useState<HackathonFormData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const dataParam = searchParams.get('data');
      if (!dataParam) {
        setError('No hackathon data provided');
        return;
      }

      // Decode and parse the data
      const decodedData = decodeURIComponent(dataParam);
      const parsedData = JSON.parse(decodedData);

      // Validate the parsed data
      if (!parsedData.title || !parsedData.description) {
        setError('Invalid hackathon data: missing required fields');
        return;
      }

      setHackathonData(parsedData as HackathonFormData);
    } catch (err) {
      console.error('Error parsing hackathon data:', err);
      setError('Invalid hackathon data format');
    }
  }, [searchParams]);

  return { hackathonData, error };
}

function HackathonPreviewContent() {
  const router = useRouter();
  const { hackathonData, error } = useHackathonData();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [activeToast, setActiveToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setActiveToast({ message, type });
    setTimeout(() => setActiveToast(null), 3000);
  };

  const handlePublishHackathon = async () => {
    if (!hackathonData) return;

    try {
      setIsPublishing(true);
      setPublishError(null);

      // Get user email from session
      let userEmail = '';
      
      try {
        // Try to get session from API first
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        
        if (sessionData.success && sessionData.session) {
          userEmail = sessionData.session.email;
          console.log('✅ Got user email from session:', userEmail);
        } else {
          // Fallback to /api/auth/me
          const meResponse = await fetch('/api/auth/me');
          const meData = await meResponse.json();
          
          if (meData.success && meData.session) {
            userEmail = meData.session.email;
            console.log('✅ Got user email from /api/auth/me:', userEmail);
          } else {
            throw new Error('No session found');
          }
        }
      } catch (error) {
        console.error('Error getting user session:', error);
        showToast('Please log in to publish a hackathon', 'error');
        return;
      }

      if (!userEmail) {
        showToast('Please log in to publish a hackathon', 'error');
        return;
      }

      console.log('🚀 Publishing hackathon with data:', {
        title: hackathonData.title,
        email: userEmail,
        prizes: hackathonData.prizes.length,
        judges: hackathonData.judges.length
      });

      const response = await fetch('/api/hackathons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail,
          hackathonData
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create hackathon');
      }

      showToast('Hackathon published successfully!', 'success');

      // Navigate to hackathon page after short delay
      setTimeout(() => {
        router.push(`/client/hackathons/${result.hackathon_id}`);
      }, 2000);

    } catch (error) {
      console.error('Error publishing hackathon:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setPublishError(errorMessage);
      showToast('Failed to publish hackathon', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  const getCompletionPercentage = () => {
    if (!hackathonData) return 0;

    let completed = 0;
    const total = 100;

    // Basic Info (30%)
    if (hackathonData.title.trim()) completed += 10;
    if (hackathonData.description.trim()) completed += 10;
    if (hackathonData.startDate && hackathonData.endDate) completed += 10;

    // Event Details (30%)
    if (hackathonData.mode && hackathonData.location) completed += 10;
    if (hackathonData.registrationStart && hackathonData.registrationEnd) completed += 10;
    if (hackathonData.maxParticipants > 0) completed += 10;

    // Content (40%)
    if (hackathonData.prizes.length > 0) completed += 15;
    if (hackathonData.judges.length > 0) completed += 15;
    if (hackathonData.schedule.length > 0) completed += 10;

    return Math.round((completed / total) * 100);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Preview Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/client/create-hackathon"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Creation
          </Link>
        </div>
      </div>
    );
  }

  if (!hackathonData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notification */}
      {activeToast && (
        <div className={cn(
          'fixed top-4 right-4 z-50 flex items-center space-x-2 px-4 py-3 rounded-lg shadow-lg transition-all',
          activeToast.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        )}>
          {activeToast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{activeToast.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/client/create-hackathon"
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft size={18} className="mr-2" />
                <span>Edit Hackathon</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">Preview & Publish</h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Completion percentage */}
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{completionPercentage}%</span>
              </div>

              <button
                onClick={handlePublishHackathon}
                disabled={completionPercentage < 70 || isPublishing}
                className={cn(
                  "px-4 py-2 rounded-md text-white transition-colors flex items-center",
                  completionPercentage >= 70
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-gray-400 cursor-not-allowed",
                  isPublishing && "opacity-50 cursor-not-allowed"
                )}
              >
                {isPublishing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Publish Hackathon
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-6">
        {/* Error Display */}
        {publishError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h4 className="font-semibold text-red-800">Publish Error</h4>
            </div>
            <p className="text-red-700 mt-1">{publishError}</p>
          </div>
        )}

        {/* Incomplete Warning */}
        {completionPercentage < 70 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-800">Almost there!</h4>
            </div>
            <p className="text-yellow-700 mt-1">
              Complete more sections to enable publishing. Add basic information, dates, prizes, judges, and schedule to reach 70% completion.
            </p>
          </div>
        )}

        {/* Hackathon Preview Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with Banner */}
          <div className="relative h-48 bg-gradient-to-r from-purple-500 to-pink-500 p-4">
            {hackathonData.bannerImage && (
              <img
                src={hackathonData.bannerImage}
                alt="Hackathon banner"
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="relative z-10">
              <h1 className="text-2xl font-bold text-white line-clamp-2 mb-2">
                {hackathonData.title || 'Untitled Hackathon'}
              </h1>
              {hackathonData.tagline && (
                <p className="text-white/80 text-lg line-clamp-1">{hackathonData.tagline}</p>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Key Details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <div>
                  <h4 className="text-xs text-gray-500">Mode</h4>
                  <p className="text-sm font-medium text-gray-900">{hackathonData.mode}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <div>
                  <h4 className="text-xs text-gray-500">Location</h4>
                  <p className="text-sm font-medium text-gray-900">{hackathonData.location || 'Virtual'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <h4 className="text-xs text-gray-500">Participants</h4>
                  <p className="text-sm font-medium text-gray-900">Max {hackathonData.maxParticipants}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div>
                  <h4 className="text-xs text-gray-500">Team Size</h4>
                  <p className="text-sm font-medium text-gray-900">{hackathonData.minTeamSize}-{hackathonData.maxTeamSize}</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="border-t pt-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Registration:</span>
                  <span className="font-medium">
                    {hackathonData.registrationStart || 'TBD'} to {hackathonData.registrationEnd || 'TBD'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Event:</span>
                  <span className="font-medium">
                    {hackathonData.startDate || 'TBD'} to {hackathonData.endDate || 'TBD'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="border-t pt-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {hackathonData.description || 'No description provided.'}
              </p>
            </div>

            {/* Prizes */}
            {hackathonData.prizes.length > 0 && (
              <div className="border-t pt-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Trophy className="w-4 h-4 mr-2" />
                  Prizes ({hackathonData.prizes.length})
                </h3>
                <div className="space-y-2">
                  {hackathonData.prizes.slice(0, 3).map((prize, index) => (
                    <div key={prize.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{prize.position}</p>
                        <p className="text-sm text-gray-600">{prize.title}</p>
                      </div>
                      <div className="text-right">
                        {prize.type === 'cash' ? (
                          <p className="font-semibold text-green-600">${prize.amount}</p>
                        ) : (
                          <p className="text-sm text-gray-500">Non-cash</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {hackathonData.prizes.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">+{hackathonData.prizes.length - 3} more prizes</p>
                  )}
                </div>
              </div>
            )}

            {/* Judges */}
            {hackathonData.judges.length > 0 && (
              <div className="border-t pt-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2" />
                  Judges ({hackathonData.judges.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hackathonData.judges.slice(0, 5).map((judge, index) => (
                    <span key={judge.id} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                      {judge.name || 'Judge ' + (index + 1)}
                    </span>
                  ))}
                  {hackathonData.judges.length > 5 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                      +{hackathonData.judges.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Schedule */}
            {hackathonData.schedule.length > 0 && (
              <div className="border-t pt-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  Schedule ({hackathonData.schedule.length} events)
                </h3>
                <div className="space-y-2">
                  {hackathonData.schedule.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{item.title}</p>
                        <p className="text-sm text-gray-600">{item.startTime} - {item.endTime}</p>
                      </div>
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {item.type}
                      </span>
                    </div>
                  ))}
                  {hackathonData.schedule.length > 3 && (
                    <p className="text-sm text-gray-500 text-center">+{hackathonData.schedule.length - 3} more events</p>
                  )}
                </div>
              </div>
            )}

            {/* Additional Details */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Registration Fee:</span>
                  <p className="font-medium">
                    {hackathonData.registrationFee > 0 ? `$${hackathonData.registrationFee}` : 'Free'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Theme:</span>
                  <p className="font-medium">{hackathonData.theme || 'General'}</p>
                </div>
              </div>
              {hackathonData.tags.length > 0 && (
                <div className="mt-3">
                  <span className="text-gray-500 text-sm">Tags:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hackathonData.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-center space-x-4">
          <Link
            href="/client/create-hackathon"
            className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit size={18} className="mr-2" />
            Edit Hackathon
          </Link>
          <button
            onClick={handlePublishHackathon}
            disabled={completionPercentage < 70 || isPublishing}
            className={cn(
              "flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors",
              completionPercentage < 70 && "bg-gray-400 cursor-not-allowed",
              isPublishing && "opacity-50 cursor-not-allowed"
            )}
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Publishing...
              </>
            ) : (
              <>
                <Upload size={18} className="mr-2" />
                Publish Hackathon
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HackathonPreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <HackathonPreviewContent />
    </Suspense>
  );
}