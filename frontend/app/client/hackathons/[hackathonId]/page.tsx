'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  UserPlus,
  Users2,
  Award,
  Target,
  Zap,
  Globe
} from 'lucide-react';
import { HackathonCanister } from '@/lib/hackathon-canister';
import { Hackathon } from '@/lib/hackathon-agent';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

// Extended interface to include additional properties
interface ExtendedHackathon extends Hackathon {
  banner_image?: string;
  prizes?: Array<{
    id?: string;
    position: string;
    amount: number;
    title?: string;
    description?: string;
  }>;
  judges?: Array<{
    id?: string;
    name: string;
    bio?: string;
    expertise?: string[];
  }>;
  schedule?: Array<{
    id?: string;
    title: string;
    description?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    type: string;
    isRequired?: boolean;
  }>;
  social_links?: Array<{
    platform: string;
    url: string;
  }>;
  registration_fee?: number;
  max_participants?: number;
  tags?: string[];
  organizer_email?: string;
  participantsCount?: number;
  teamsCount?: number;
  submissionsCount?: number;
  categories?: Array<{
    id: string;
    name: string;
    description: string;
    rewardSlots: number;
    judgingCriteria: string[];
  }>;
  rewards?: Array<{
    id: string;
    title: string;
    description: string;
    amount: string;
    rank: number;
    categoryId?: string | null;
    perks?: string[];
  }>;
}

interface HackathonViewPageProps {
  params: Promise<{
    hackathonId: string;
  }>;
}

export default function HackathonViewPage({ params }: HackathonViewPageProps) {
  const [hackathonId, setHackathonId] = useState<string>('');
  const router = useRouter();

  const [hackathon, setHackathon] = useState<ExtendedHackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [winners, setWinners] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [assigningWinner, setAssigningWinner] = useState(false);

  // Get user email from session
  const [userEmail, setUserEmail] = useState<string>('');
  const [isOwner, setIsOwner] = useState(false);

  // Resolve params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setHackathonId(resolvedParams.hackathonId);
    };
    resolveParams();
  }, [params]);

  // Get user email from session
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.session && data.session.email) {
            setUserEmail(data.session.email);
          }
        }
      } catch (error) {
        console.error('Error getting user email:', error);
      }
    };
    getUserEmail();
  }, []);

  // Load hackathon data from HackQuest canister
  const loadHackathon = useCallback(async () => {
    if (!hackathonId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Loading hackathon details for ID:', hackathonId);

      // Fetch hackathon data from HackQuest canister API
      const response = await fetch(`/api/hackquest/hackathon/${hackathonId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to load hackathon');
        return;
      }

      const hackathonData = result.data;
      console.log('✅ Hackathon data loaded:', hackathonData);

      // Transform to match ExtendedHackathon interface
      const transformedData: ExtendedHackathon = {
        hackathon_id: hackathonData.hackathon_id,
        title: hackathonData.title,
        tagline: hackathonData.tagline,
        description: hackathonData.description,
        theme: hackathonData.theme,
        mode: hackathonData.mode,
        location: hackathonData.location,
        start_date: hackathonData.start_date,
        end_date: hackathonData.end_date,
        registration_start: hackathonData.registration_start,
        registration_end: hackathonData.registration_end,
        min_team_size: hackathonData.min_team_size,
        max_team_size: hackathonData.max_team_size,
        prize_pool: hackathonData.prize_pool,
        status: hackathonData.status,
        created_at: hackathonData.created_at,
        updated_at: hackathonData.updated_at,
        banner_image: hackathonData.bannerUrl || hackathonData.banner_image,
        rules: '', // HackQuest doesn't have rules field
        organizer_email: userEmail, // Will be checked separately
        // Stats from canister
        participantsCount: hackathonData.participantsCount || 0,
        teamsCount: hackathonData.teamsCount || 0,
        submissionsCount: hackathonData.submissionsCount || 0,
        // Categories and rewards from canister
        categories: hackathonData.categories || [],
        rewards: hackathonData.rewards || [],
      };

      setHackathon(transformedData);

      // Check if current user is the owner by checking if they created this hackathon
      // We'll check this by seeing if the hackathon is in their list
      if (userEmail) {
        const userHackathonsResponse = await fetch(`/api/hackquest/user-hackathons?email=${encodeURIComponent(userEmail)}`);
        if (userHackathonsResponse.ok) {
          const userHackathonsData = await userHackathonsResponse.json();
          if (userHackathonsData.success) {
            const isUserHackathon = userHackathonsData.hackathons.some((h: any) => h.id === hackathonId);
            setIsOwner(isUserHackathon);
            console.log('👤 User ownership check:', { userEmail, hackathonId, isOwner: isUserHackathon });
          }
        }
      }

      // Set participants and teams counts from canister data
      setParticipants([]); // Participants list not available in current API
      setTeams([]); // Teams list not available in current API

      // Load submissions and winners
      await loadSubmissions();
      await loadWinners();

    } catch (err) {
      console.error('Error loading hackathon:', err);
      setError('Failed to load hackathon details');
    } finally {
      setLoading(false);
    }
  }, [hackathonId, userEmail]);

  // Load submissions
  const loadSubmissions = useCallback(async () => {
    if (!hackathonId) return;

    try {
      const response = await fetch(`/api/hackquest/submissions?hackathonId=${encodeURIComponent(hackathonId)}${selectedCategory !== 'all' ? `&categoryId=${encodeURIComponent(selectedCategory)}` : ''}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSubmissions(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  }, [hackathonId, selectedCategory]);

  // Load winners
  const loadWinners = useCallback(async () => {
    if (!hackathonId) return;

    try {
      const response = await fetch(`/api/hackquest/winners/list?hackathonId=${encodeURIComponent(hackathonId)}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setWinners(result.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading winners:', error);
    }
  }, [hackathonId]);

  // Load hackathon on component mount
  useEffect(() => {
    loadHackathon();
  }, [loadHackathon]);

  // Reload submissions when category changes
  useEffect(() => {
    if (hackathonId) {
      loadSubmissions();
    }
  }, [loadSubmissions]);

  // Handle assign winner
  const handleAssignWinner = async (rewardId: string, note?: string) => {
    if (!selectedSubmission || !hackathon) return;

    try {
      setAssigningWinner(true);

      const response = await fetch('/api/hackquest/winners/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId,
          rewardId,
          submissionId: selectedSubmission.id,
          note: note || '',
          organizerEmail: userEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Winner assigned successfully!');
        setShowWinnerModal(false);
        setSelectedSubmission(null);
        await loadWinners();
        await loadSubmissions();
      } else {
        alert(result.error || 'Failed to assign winner');
      }
    } catch (error) {
      console.error('Error assigning winner:', error);
      alert('Failed to assign winner. Please try again.');
    } finally {
      setAssigningWinner(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!userEmail) {
      alert('Please login to delete this hackathon');
      return;
    }

    if (!confirm('Are you sure you want to delete this hackathon? This action cannot be undone.')) {
      return;
    }

    try {
      const organizerPrincipal = getPrincipalFromEmail(userEmail).toText();
      const response = await fetch(`/api/hackquest/hackathon/${hackathonId}?organizer=${encodeURIComponent(organizerPrincipal)}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Hackathon deleted successfully!');
        router.push('/client/hackathons');
      } else {
        alert(result.error || 'Failed to delete hackathon');
      }
    } catch (error) {
      console.error('Error deleting hackathon:', error);
      alert('Failed to delete hackathon. Please try again.');
    }
  };

  // Get status display text and color
  const getStatusInfo = (hackathon: Hackathon) => {
    if (hackathon.status?.Cancelled !== undefined && hackathon.status?.Cancelled !== null) {
      return { text: 'Cancelled', color: 'bg-red-100 text-red-800', icon: AlertCircle };
    }

    const now = new Date();
    const startDate = new Date(hackathon.start_date);
    const endDate = new Date(hackathon.end_date);

    if (now < startDate) {
      return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800', icon: Calendar };
    } else if (now >= startDate && now <= endDate) {
      return { text: 'Ongoing', color: 'bg-green-100 text-green-800', icon: Clock };
    } else {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle };
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if registration is open
  const isRegistrationOpen = () => {
    if (!hackathon) return false;
    const now = new Date();
    const regStart = new Date(hackathon.registration_start);
    const regEnd = new Date(hackathon.registration_end);
    return now >= regStart && now <= regEnd;
  };

  // Check if hackathon is ongoing
  const isHackathonOngoing = () => {
    if (!hackathon) return false;
    const now = new Date();
    const start = new Date(hackathon.start_date);
    const end = new Date(hackathon.end_date);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-600">Loading hackathon details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !hackathon) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <p className="text-red-700">{error || 'Hackathon not found'}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href="/client/hackathons"
                className="inline-flex items-center text-purple-600 hover:text-purple-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Hackathons
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(hackathon);
  const StatusIcon = statusInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/client/hackathons"
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to My Hackathons
              </Link>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${statusInfo.color}`}>
                <StatusIcon className="w-4 h-4 mr-1" />
                {statusInfo.text}
              </span>
              {isOwner && (
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/client/hackathons/${hackathonId}/edit`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Link>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="relative rounded-lg overflow-hidden">
              {hackathon.banner_image && !hackathon.banner_image.startsWith('blob:') ? (
                <div className="relative">
                  <img
                    src={hackathon.banner_image}
                    alt="Hackathon banner"
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                    <h1 className="text-3xl font-bold mb-2">{hackathon.title}</h1>
                    <p className="text-xl text-white/90 mb-4">{hackathon.tagline}</p>
                    <div className="flex items-center space-x-6 text-white/80">
                      <span className="flex items-center">
                        <Calendar className="w-5 h-5 mr-2" />
                        {formatDate(hackathon.start_date)}
                      </span>
                      <span className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        {hackathon.location}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        {hackathon.min_team_size}-{hackathon.max_team_size} people/team
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{hackathon.prize_pool}</div>
                      <div className="text-white/80">Prize Pool</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold mb-2">{hackathon.title}</h1>
                      <p className="text-xl text-white/90 mb-4">{hackathon.tagline}</p>
                      <div className="flex items-center space-x-6 text-white/80">
                        <span className="flex items-center">
                          <Calendar className="w-5 h-5 mr-2" />
                          {formatDate(hackathon.start_date)}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-5 h-5 mr-2" />
                          {hackathon.location}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-5 h-5 mr-2" />
                          {hackathon.min_team_size}-{hackathon.max_team_size} people/team
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{hackathon.prize_pool}</div>
                      <div className="text-white/80">Prize Pool</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Hackathon</h2>
              <p className="text-gray-700 leading-relaxed">{hackathon.description}</p>
            </div>

            {/* Important Dates */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Dates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">Registration Opens</div>
                    <div className="text-sm text-gray-600">{formatDate(hackathon.registration_start)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
                  <Clock className="w-6 h-6 text-red-600" />
                  <div>
                    <div className="font-medium text-gray-900">Registration Closes</div>
                    <div className="text-sm text-gray-600">{formatDate(hackathon.registration_end)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                  <Zap className="w-6 h-6 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">Hackathon Starts</div>
                    <div className="text-sm text-gray-600">{formatDate(hackathon.start_date)}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                  <Award className="w-6 h-6 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">Hackathon Ends</div>
                    <div className="text-sm text-gray-600">{formatDate(hackathon.end_date)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Rules & Guidelines</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{hackathon.rules || 'No specific rules provided.'}</p>
              </div>
            </div>

            {/* Prizes */}
            {hackathon.prizes && hackathon.prizes.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-yellow-600" />
                  Prizes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {hackathon.prizes.map((prize: any, index: number) => (
                    <div key={prize.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{prize.position}</h3>
                        <span className="text-lg font-bold text-green-600">
                          {prize.amount > 0 ? `$${prize.amount}` : 'Trophy'}
                        </span>
                      </div>
                      {prize.title && (
                        <p className="text-sm text-gray-600 mb-2">{prize.title}</p>
                      )}
                      {prize.description && (
                        <p className="text-sm text-gray-700">{prize.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Judges */}
            {hackathon.judges && hackathon.judges.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-6 h-6 mr-2 text-blue-600" />
                  Judges
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {hackathon.judges.map((judge: any, index: number) => (
                    <div key={judge.id || index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-600">
                          {judge.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{judge.name}</h3>
                        {judge.bio && (
                          <p className="text-sm text-gray-600 mt-1">{judge.bio}</p>
                        )}
                        {judge.expertise && judge.expertise.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {judge.expertise.map((skill: string, skillIndex: number) => (
                                <span key={skillIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Schedule */}
            {hackathon.schedule && hackathon.schedule.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-green-600" />
                  Schedule
                </h2>
                <div className="space-y-4">
                  {hackathon.schedule.map((event: any, index: number) => (
                    <div key={event.id || index} className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full mt-2 ${
                          event.type === 'opening' ? 'bg-green-500' :
                          event.type === 'workshop' ? 'bg-blue-500' :
                          event.type === 'break' ? 'bg-yellow-500' :
                          event.type === 'presentation' ? 'bg-purple-500' :
                          event.type === 'judging' ? 'bg-red-500' :
                          event.type === 'awards' ? 'bg-yellow-600' :
                          event.type === 'closing' ? 'bg-gray-500' :
                          'bg-gray-400'
                        }`}></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900">{event.title}</h3>
                          {event.isRequired && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                              Required
                            </span>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {formatDate(event.date)}
                          </span>
                          {event.startTime && event.endTime && (
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {event.startTime} - {event.endTime}
                            </span>
                          )}
                          {event.location && (
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {hackathon.social_links && hackathon.social_links.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="w-6 h-6 mr-2 text-purple-600" />
                  Social Links
                </h2>
                <div className="flex flex-wrap gap-3">
                  {hackathon.social_links.map((link: any, index: number) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {link.platform}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Submitted Projects */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Target className="w-6 h-6 mr-2 text-green-600" />
                    Submitted Projects
                  </h2>
                  {hackathon.categories && hackathon.categories.length > 0 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="all">All Categories</option>
                      {hackathon.categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {submissions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No submissions yet.</p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission: any) => {
                      const isWinner = winners.some((w: any) => w.awardedSubmissionId === submission.id);
                      return (
                                <div
                                  key={submission.id}
                                  className={`border-2 rounded-xl p-5 shadow-sm transition-all ${
                                    isWinner 
                                      ? 'bg-yellow-50 border-yellow-400 ring-2 ring-yellow-200' 
                                      : 'border-gray-200 bg-white hover:border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold text-gray-900">{submission.title}</h3>
                                        {isWinner && (
                                          <div className="flex items-center gap-1.5 px-3 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-black uppercase tracking-tighter shadow-sm">
                                            <Award className="w-3.5 h-3.5" />
                                            WINNER
                                          </div>
                                        )}
                                {(() => {
                                  if (submission.status.Selected !== undefined) {
                                    return (
                                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                                        Selected
                                      </span>
                                    );
                                  }
                                  if (submission.status.UnderReview !== undefined) {
                                    return (
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                        Under Review
                                      </span>
                                    );
                                  }
                                  if (submission.status.Rejected !== undefined) {
                                    return (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                        Rejected
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{submission.summary}</p>
                              {submission.team && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm font-medium text-gray-700 mb-2">Team: {submission.team.name}</p>
                                  <div className="space-y-1">
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Leader:</span> {submission.team.leader.displayName} ({submission.team.leader.email})
                                    </p>
                                    {submission.team.members.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-gray-600 mb-1">Members:</p>
                                        {submission.team.members.map((member: any, idx: number) => (
                                          <p key={idx} className="text-xs text-gray-600 ml-2">
                                            • {member.displayName} ({member.email})
                                            {member.accepted ? ' ✓' : ' (Pending)'}
                                          </p>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <Link
                              href={`/freelancer/hackathons/${hackathonId}/view-project?submissionId=${submission.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:text-purple-700 flex items-center font-medium"
                            >
                              <Target className="w-4 h-4 mr-1" />
                              View Project
                            </Link>
                            {submission.repoUrl && (
                              <a
                                href={submission.repoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                              >
                                <Globe className="w-4 h-4 mr-1" />
                                Repository
                              </a>
                            )}
                            {submission.demoUrl && (
                              <a
                                href={submission.demoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                              >
                                <Globe className="w-4 h-4 mr-1" />
                                Demo
                              </a>
                            )}
                            {isOwner && !isWinner && submission.status.Selected === undefined && hackathon.rewards && hackathon.rewards.length > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedSubmission(submission);
                                  setShowWinnerModal(true);
                                }}
                                className="ml-auto px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                              >
                                Select as Winner
                              </button>
                            )}
                          </div>
                          {submission.gallery && submission.gallery.length > 0 && (
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {submission.gallery.slice(0, 3).map((img: string, idx: number) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Gallery ${idx + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Winners Section */}
            {isOwner && winners.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Award className="w-6 h-6 mr-2 text-yellow-600" />
                  Declared Winners
                </h2>
                <div className="space-y-4">
                  {winners.map((winner: any) => (
                    <div key={winner.id} className="border-2 border-yellow-400 bg-yellow-50 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Award className="w-5 h-5 text-yellow-600" />
                            <h3 className="font-bold text-lg text-gray-900">{winner.title}</h3>
                            <span className="px-2 py-0.5 bg-yellow-200 text-yellow-800 text-xs rounded-full font-bold uppercase tracking-wider">
                              Rank #{winner.rank}
                            </span>
                          </div>
                          
                          <div className="pl-7 border-l-2 border-yellow-200">
                            <p className="text-sm font-semibold text-gray-800">
                              Winning Project: <span className="text-purple-700">{winner.submissionTitle}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                              By Team: <span className="font-medium text-gray-900">{winner.teamName}</span>
                            </p>
                          </div>

                          <p className="text-sm text-gray-600">{winner.description}</p>
                          
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-sm font-bold text-green-700 bg-green-100 px-3 py-1 rounded-lg">
                              Prize: {Number(winner.amount).toLocaleString()} ICP
                            </p>
                            {winner.note && (
                              <p className="text-xs text-gray-500 italic">"{winner.note}"</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    Participants
                  </span>
                  <span className="font-semibold">{hackathon?.participantsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-600">
                    <Users2 className="w-4 h-4 mr-2" />
                    Teams
                  </span>
                  <span className="font-semibold">{hackathon?.teamsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-600">
                    <Target className="w-4 h-4 mr-2" />
                    Projects Submitted
                  </span>
                  <span className="font-semibold">{hackathon?.submissionsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-600">
                    <Target className="w-4 h-4 mr-2" />
                    Theme
                  </span>
                  <span className="font-semibold text-sm">{hackathon.theme}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-gray-600">
                    <Settings className="w-4 h-4 mr-2" />
                    Mode
                  </span>
                  <span className="font-semibold">{Object.keys(hackathon.mode)[0]}</span>
                </div>
                {hackathon.registration_fee && hackathon.registration_fee > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <DollarSign className="w-4 h-4 mr-2" />
                      Registration Fee
                    </span>
                    <span className="font-semibold">${hackathon.registration_fee}</span>
                  </div>
                )}
                {hackathon.max_participants && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      Max Participants
                    </span>
                    <span className="font-semibold">{hackathon.max_participants}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tags */}
            {hackathon.tags && hackathon.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {hackathon.tags.map((tag: string, index: number) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Registration Status */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Status</h3>
              {isRegistrationOpen() ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="text-green-800 font-medium">Registration is Open!</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Register before {formatDate(hackathon.registration_end)}
                  </p>
                  <button className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    Register Now
                  </button>
                </div>
              ) : isHackathonOngoing() ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-blue-800 font-medium">Hackathon is Ongoing!</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Event ends {formatDate(hackathon.end_date)}
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-800 font-medium">Registration Closed</p>
                  <p className="text-sm text-gray-600 mt-2">
                    {new Date(hackathon.registration_end) > new Date()
                      ? `Opens ${formatDate(hackathon.registration_start)}`
                      : 'Registration has ended'
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            {isOwner && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Hackathon</h3>
                <div className="space-y-3">
                  <Link
                    href={`/client/hackathons/${hackathonId}/edit`}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Details
                  </Link>
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                    <Users className="w-4 h-4 mr-2" />
                    View Participants
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center">
                    <Users2 className="w-4 h-4 mr-2" />
                    Manage Teams
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Winner Selection Modal */}
        {showWinnerModal && selectedSubmission && hackathon && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Select Winner</h2>
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    setSelectedSubmission(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Project:</p>
                <p className="font-semibold text-gray-900">{selectedSubmission.title}</p>
                <p className="text-sm text-gray-600 mt-1">{selectedSubmission.summary}</p>
                {selectedSubmission.team && (
                  <p className="text-sm text-gray-600 mt-2">Team: {selectedSubmission.team.name}</p>
                )}
              </div>

              {hackathon.rewards && hackathon.rewards.length > 0 ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Reward Tier:
                  </label>
                  {hackathon.rewards
                    .filter((reward: any) => {
                      // Filter rewards by category if submission has a category
                      if (selectedSubmission.categoryId && reward.categoryId) {
                        return reward.categoryId === selectedSubmission.categoryId;
                      }
                      // Show all rewards if no category match or no category
                      return true;
                    })
                    .sort((a: any, b: any) => a.rank - b.rank)
                    .map((reward: any) => {
                      const isAlreadyWinner = winners.some((w: any) => w.id === reward.id);
                      return (
                        <div
                          key={reward.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                            isAlreadyWinner
                              ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                              : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                          }`}
                          onClick={() => {
                            if (!isAlreadyWinner) {
                              handleAssignWinner(reward.id);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{reward.title}</h3>
                              <p className="text-sm text-gray-600">{reward.description}</p>
                              <p className="text-sm font-medium text-green-600 mt-1">
                                {Number(reward.amount).toLocaleString()} ICP
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-xs text-gray-500">Rank #{reward.rank}</span>
                              {isAlreadyWinner && (
                                <p className="text-xs text-red-600 mt-1">Already assigned</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No rewards configured for this hackathon.</p>
              )}

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    setSelectedSubmission(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}