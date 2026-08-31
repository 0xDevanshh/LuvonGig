'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { getUserProfileByEmail } from '@/lib/user-profile';
import { getPrincipalFromEmail } from '@/lib/principal-utils';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Globe,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Clock,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  X,
  ExternalLink,
  Award,
  Trophy
} from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  tagline: string;
  description: string;
  theme: string;
  location: string;
  bannerUrl: string;
  prizePool?: string;
  prize_pool?: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  submission_start?: string;
  submission_end?: string;
  min_team_size: number;
  max_team_size: number;
  status: { Upcoming?: null; Ongoing?: null; Judging?: null; Draft?: null; Completed?: null; Cancelled?: null };
  categories: Array<{ id: string; name: string; description: string }>;
  rewards: Array<{ id: string; title: string; description: string; amount: string; rank: number }>;
  faq: string[];
  resources: string[];
  participantsCount?: number;
  teamsCount?: number;
  submissionsCount?: number;
  isOrganizer?: boolean;
  isRegistered?: boolean;
  organizerEmail?: string | null;
}

interface Team {
  id: string;
  name: string;
  leader: string;
  members: Array<{
    principal: string;
    accepted: boolean;
    invitedAt: number;
    acceptedAt: number | null;
    email?: string;
    displayName?: string;
  }>;
  categoryId: string | null;
  submissionId?: string | null;
}

interface Invitation {
  teamId: string;
  teamName: string;
  hackathonId: string;
  hackathonTitle: string;
  leader: string;
  invitedAt: number;
}

export default function FreelancerHackathonDetail() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const hackathonId = params.id;

  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSoloModal, setShowSoloModal] = useState(false);
  const [soloCategoryId, setSoloCategoryId] = useState('');
  const [teamForm, setTeamForm] = useState({
    name: '',
    categoryId: '',
    inviteeEmails: [''] as string[],
  });
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [isWinner, setIsWinner] = useState(false);
  const [winnerReward, setWinnerReward] = useState<any>(null);
  const [now, setNow] = useState(new Date());

  // Update timer every minute
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get user email (no wallet required)
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.session?.email) {
            setUserEmail(sessionData.session.email);
            try {
              const principal = getPrincipalFromEmail(sessionData.session.email);
              setUserPrincipal(principal.toText());
            } catch (err) {
              console.error('Failed to generate principal:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    getUserInfo();
  }, []);

  // Load hackathon details
  const loadHackathon = useCallback(async () => {
    if (!hackathonId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/hackquest/hackathon/${hackathonId}`);
      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Failed to load hackathon');
        return;
      }

      const data = result.data;

      let isOrganizer = false;
      if (userEmail && data.organizerEmail) {
        isOrganizer = userEmail.toLowerCase().trim() === data.organizerEmail.toLowerCase().trim();
      }

      setHackathon({
        ...data,
        isOrganizer,
      });

      if (userEmail) {
        try {
          const regResponse = await fetch(`/api/hackquest/participants/check-by-email?email=${encodeURIComponent(userEmail)}&hackathonId=${encodeURIComponent(hackathonId)}`);
          if (regResponse.ok) {
            const regData = await regResponse.json();
            setIsRegistered(regData.isRegisteredForHackathon || false);
          }
        } catch (error) {
          console.error('Error checking registration:', error);
        }
      }

    } catch (err) {
      console.error('Error loading hackathon:', err);
      setError('Failed to load hackathon details');
    } finally {
      setLoading(false);
    }
  }, [hackathonId, userEmail]);

  // Load teams (using email, no wallet required)
  const loadTeams = useCallback(async () => {
    if (!hackathonId || !userEmail) return;

    try {
      const principalToUse = userPrincipal || getPrincipalFromEmail(userEmail).toText();

      const response = await fetch(`/api/hackquest/teams?hackathonId=${encodeURIComponent(hackathonId)}&principal=${encodeURIComponent(principalToUse)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTeams(data.teams || []);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  }, [hackathonId, userEmail, userPrincipal]);

  // Load invitations
  const loadInvitations = useCallback(async () => {
    if (!userEmail) return;

    try {
      const response = await fetch(`/api/hackquest/teams/invitations?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInvitations(data.invitations || []);
        }
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    }
  }, [userEmail]);

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

  // Check if user is a winner after both winners and teams are loaded
  useEffect(() => {
    if (winners.length > 0 && teams.length > 0) {
      const userTeamSubmissionIds = teams
        .filter(team => team.submissionId)
        .map(team => team.submissionId);

      const userWinningReward = winners.find((winner: any) =>
        winner.awardedSubmissionId && userTeamSubmissionIds.includes(winner.awardedSubmissionId)
      );

      if (userWinningReward) {
        setIsWinner(true);
        setWinnerReward(userWinningReward);
      } else {
        setIsWinner(false);
        setWinnerReward(null);
      }
    } else if (winners.length > 0 && teams.length === 0) {
      // Results declared but user has no teams/submissions
      setIsWinner(false);
      setWinnerReward(null);
    }
  }, [winners, teams]);

  useEffect(() => {
    loadHackathon();
  }, [loadHackathon]);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  useEffect(() => {
    loadWinners();
  }, [loadWinners]);

  // Handle registration
  const handleRegister = async () => {
    if (!userEmail) {
      alert('Please login to register');
      return;
    }

    if (hackathon?.isOrganizer) {
      alert('You cannot register for a hackathon you created');
      return;
    }

    try {
      setIsRegistering(true);

      // Get display name from user profile
      let displayName = userEmail.split('@')[0];
      try {
        const profile = await getUserProfileByEmail(userEmail);
        if (profile) {
          displayName = profile.displayName || profile.firstName || displayName;
        }
      } catch (error) {
        console.warn('Error fetching display name for registration:', error);
      }

      // No wallet required - registration uses email only
      const response = await fetch('/api/hackquest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          email: userEmail,
          hackathonId: hackathonId, // Register for this specific hackathon
          // Principal will be generated deterministically from email on the server
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Successfully registered for the hackathon!');
        // Refresh registration status and hackathon data
        setIsRegistered(true);
        // Reload hackathon to get updated participant count
        await loadHackathon();
        // Also reload teams in case user wants to create one
        await loadTeams();
      } else {
        alert(result.error || 'Failed to register');
      }
    } catch (error) {
      console.error('Error registering:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Handle "Go Solo" - create a solo team (only if min team size is 1)
  const handleGoSolo = async () => {
    if (!hackathonId || !userEmail) {
      alert('Please login to go solo');
      return;
    }

    if (hackathon?.min_team_size !== 1) {
      alert('Solo participation is not allowed for this hackathon');
      return;
    }

    // Check if user already has a solo team
    if (teams.some(t => t.members.length === 1 && t.leader === userPrincipal)) {
      alert('You already have a solo team');
      return;
    }

    try {
      setIsCreatingTeam(true);

      // Get principal from email if not already available
      let leaderPrincipal = userPrincipal;
      if (!leaderPrincipal && userEmail) {
        try {
          const checkResponse = await fetch(`/api/hackquest/participants/check-by-email?email=${encodeURIComponent(userEmail)}&hackathonId=${encodeURIComponent(hackathonId)}`);
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            if (checkData.success && checkData.principal) {
              leaderPrincipal = checkData.principal;
              setUserPrincipal(checkData.principal);
            }
          }
        } catch (error) {
          console.warn('Could not get principal from email:', error);
        }
      }

      if (!leaderPrincipal) {
        alert('Please register for the hackathon first before going solo');
        return;
      }

      // Create a solo team (team with just the leader, no invitees)
      const response = await fetch('/api/hackquest/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId,
          categoryId: soloCategoryId || null, // Use selected category or null
          teamName: `${userEmail.split('@')[0]} (Solo)`, // Auto-generate solo team name
          inviteeEmails: [], // No invitees for solo
          leaderEmail: userEmail,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Solo team created successfully! You can now submit your project.');
        setShowSoloModal(false);
        setSoloCategoryId('');
        loadTeams();
      } else {
        alert(result.error || 'Failed to create solo team');
      }
    } catch (error) {
      console.error('Error creating solo team:', error);
      alert('Failed to create solo team. Please try again.');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Handle team creation
  const handleCreateTeam = async () => {
    if (!hackathonId || !userEmail) {
      alert('Please login to create a team');
      return;
    }

    if (!teamForm.name.trim()) {
      alert('Please enter a team name');
      return;
    }

    try {
      setIsCreatingTeam(true);

      // Get principal from email if not already available
      let leaderPrincipal = userPrincipal;
      if (!leaderPrincipal && userEmail) {
        try {
          leaderPrincipal = getPrincipalFromEmail(userEmail).toText();
          setUserPrincipal(leaderPrincipal);
        } catch (error) {
          console.warn('Could not generate principal from email:', error);
        }
      }

      if (!leaderPrincipal) {
        alert('Please register for the hackathon first before creating a team');
        return;
      }

      const response = await fetch('/api/hackquest/teams/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hackathonId,
          categoryId: teamForm.categoryId || null,
          teamName: teamForm.name,
          inviteeEmails: teamForm.inviteeEmails.filter(email => email.trim()),
          leaderEmail: userEmail, // Pass email, API will derive principal
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Team created successfully! Invitations have been sent.');
        setShowTeamModal(false);
        setTeamForm({ name: '', categoryId: '', inviteeEmails: [''] });
        loadTeams();
      } else {
        alert(result.error || 'Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      alert('Failed to create team. Please try again.');
    } finally {
      setIsCreatingTeam(false);
    }
  };

  // Handle invitation response (using email, no wallet required)
  const handleInvitationResponse = async (teamId: string, accept: boolean) => {
    if (!userEmail) {
      alert('Please login to respond to invitations');
      return;
    }

    // Get principal from email-based registration check
    let principalToUse = userPrincipal;
    if (!principalToUse) {
      try {
        const checkResponse = await fetch(`/api/hackquest/participants/check-by-email?email=${encodeURIComponent(userEmail)}&hackathonId=${encodeURIComponent(hackathonId)}`);
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.success && checkData.principal) {
            principalToUse = checkData.principal;
            setUserPrincipal(checkData.principal);
          }
        }
      } catch (error) {
        console.warn('Could not get principal from email:', error);
      }
    }

    if (!principalToUse) {
      alert('Please register for the hackathon first');
      return;
    }

    try {
      const response = await fetch('/api/hackquest/teams/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId,
          accept,
          principal: principalToUse,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(accept ? 'Invitation accepted!' : 'Invitation declined');
        loadInvitations();
        loadTeams();
      } else {
        alert(result.error || 'Failed to respond to invitation');
      }
    } catch (error) {
      console.error('Error responding to invitation:', error);
      alert('Failed to respond. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isRegistrationOpen = () => {
    if (!hackathon) return false;
    const now = new Date();
    const regStart = new Date(hackathon.registration_start);
    const regEnd = new Date(hackathon.registration_end);
    return now >= regStart && now <= regEnd;
  };

  const getStatusInfo = () => {
    if (!hackathon) return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };

    if (hackathon.status?.Cancelled !== undefined && hackathon.status?.Cancelled !== null) {
      return { text: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle };
    }

    const startDate = new Date(hackathon.start_date);
    const endDate = new Date(hackathon.end_date);

    if (now < startDate) {
      return { text: 'Upcoming', color: 'bg-blue-100 text-blue-800', icon: Calendar };
    } else if (now >= startDate && now <= endDate) {
      return { text: 'Ongoing', color: 'bg-green-100 text-green-800', icon: Clock };
    } else {
      return { text: 'Completed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle2 };
    }
  };

  const isSubmissionOpen = () => {
    if (!hackathon || !hackathon.start_date || !hackathon.end_date) return false;
    const subStart = new Date(hackathon.start_date);
    const subEnd = new Date(hackathon.end_date);
    return now >= subStart && now <= subEnd;
  };

  const calculateTimeRemaining = () => {
    if (!hackathon) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    // Use registration_end for registration countdown
    const regEnd = new Date(hackathon.registration_end);
    const diff = regEnd.getTime() - now.getTime();

    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
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
        <div className="max-w-7xl mx-auto">
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
                href="/freelancer/hackathons"
                className="inline-flex items-center text-purple-600 hover:text-purple-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Hackathons
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const timeRemaining = calculateTimeRemaining();
  const registrationOpen = isRegistrationOpen();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Back button */}
        <Link
          href="/freelancer/hackathons"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Hackathons
        </Link>

        {/* Banner */}
        <div className="relative rounded-lg overflow-hidden mb-6 h-64">
          {hackathon.bannerUrl ? (
            <img
              src={hackathon.bannerUrl}
              alt={hackathon.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-purple-500 to-pink-500" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              {hackathon.title}
              {(() => {
                const info = getStatusInfo();
                const Icon = info.icon;
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${info.color}`}>
                    {Icon && <Icon className="w-3 h-3 mr-1" />}
                    {info.text}
                  </span>
                );
              })()}
            </h1>
            <p className="text-xl text-white/90">{hackathon.tagline}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Winner Announcement Banner */}
            {winners.length > 0 && (
              <div className={`rounded-lg p-6 border-2 ${isWinner
                ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-400'
                : 'bg-blue-50 border-blue-200'
                }`}>
                {isWinner ? (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-yellow-900" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-yellow-900 mb-2 flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Congratulations! You're a Winner! 🎉
                      </h3>
                      {winnerReward && (
                        <div className="mb-3">
                          <p className="text-yellow-800 font-semibold mb-1">
                            {winnerReward.title} - Rank #{winnerReward.rank}
                          </p>
                          <p className="text-yellow-700 text-sm mb-2">{winnerReward.description}</p>
                          <p className="text-yellow-900 font-bold text-lg">
                            Prize: {Number(winnerReward.amount).toLocaleString()} ICP
                          </p>
                        </div>
                      )}
                      <div className="bg-white/80 rounded-lg p-4 mt-3">
                        <p className="text-gray-800 text-sm font-medium">
                          🎊 You have been selected as a track winner! The company will contact you at <span className="font-semibold">{userEmail}</span> regarding the reward distribution.
                        </p>
                        <p className="text-gray-600 text-xs mt-2">
                          Please ensure your email is up to date and check your inbox regularly for further instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-400 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-900" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Results Have Been Declared
                      </h3>
                      <p className="text-blue-800 text-sm">
                        The hackathon results have been announced. Thank you for participating! Check out the winners below.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {['overview', 'prizes', 'teams'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${activeTab === tab
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-4">{hackathon.title}</h2>
                      <p className="text-gray-700 leading-relaxed">{hackathon.description}</p>
                    </div>

                    {hackathon.faq && hackathon.faq.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">FAQ</h3>
                        <div className="space-y-3">
                          {hackathon.faq.map((faq, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                              <p className="text-gray-700">{faq}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {hackathon.resources && hackathon.resources.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Resources</h3>
                        <div className="space-y-2">
                          {hackathon.resources.map((resource, index) => (
                            <a
                              key={index}
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-700"
                            >
                              <Globe className="w-4 h-4 mr-2" />
                              {resource}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'prizes' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold mb-4">Prizes & Rewards</h2>
                      <p className="text-gray-600 mb-6">Total Prize Pool: {Number(hackathon.prizePool || hackathon.prize_pool || 0).toLocaleString()} ICP</p>

                      {hackathon.rewards && hackathon.rewards.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {hackathon.rewards
                            .sort((a, b) => a.rank - b.rank)
                            .map((reward) => (
                              <div key={reward.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-semibold text-gray-900">{reward.title}</h3>
                                  <span className="text-lg font-bold text-green-600">
                                    {Number(reward.amount).toLocaleString()} ICP
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600">{reward.description}</p>
                                <div className="mt-2">
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                    Rank #{reward.rank}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <p className="text-gray-500">No rewards specified yet.</p>
                      )}
                    </div>

                    {hackathon.categories && hackathon.categories.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Categories</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {hackathon.categories.map((category) => (
                            <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                              <h4 className="font-semibold text-gray-900 mb-2">{category.name}</h4>
                              <p className="text-sm text-gray-600">{category.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'teams' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold">Teams</h2>
                      {!hackathon.isOrganizer && isRegistered && teams.length === 0 && (
                        <div className="flex gap-3">
                          {/* Go Solo option - only show if min team size is 1 */}
                          {hackathon.min_team_size === 1 && (
                            <button
                              onClick={() => setShowSoloModal(true)}
                              disabled={isCreatingTeam || teams.some(t => t.members.length === 1 && t.leader === userPrincipal)}
                              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Go Solo
                            </button>
                          )}
                          <button
                            onClick={() => setShowTeamModal(true)}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Create Team
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pending Invitations */}
                    {invitations.filter(inv => inv.hackathonId === hackathonId).length > 0 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-3">Pending Team Invitations</h3>
                        <div className="space-y-2">
                          {invitations
                            .filter(inv => inv.hackathonId === hackathonId)
                            .map((invitation) => (
                              <div key={invitation.teamId} className="bg-white rounded-lg p-4 border border-blue-200">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">Invited to join: {invitation.teamName}</p>
                                    <p className="text-sm text-gray-600">Invited {new Date(invitation.invitedAt * 1000).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleInvitationResponse(invitation.teamId, true)}
                                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleInvitationResponse(invitation.teamId, false)}
                                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                                    >
                                      Decline
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* My Teams */}
                    {teams.length > 0 ? (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">My Teams</h3>
                        <div className="space-y-4">
                          {teams.map((team) => {
                            const acceptedMembers = team.members.filter(m => m.accepted).length;
                            const isSoloTeam = acceptedMembers === 1 && hackathon.min_team_size === 1;
                            const hasMinimumMembers = acceptedMembers >= hackathon.min_team_size;
                            const submissionOpen = isSubmissionOpen();
                            // Category is required for all teams (including solo) to submit
                            const canSubmit = hasMinimumMembers && team.categoryId && !team.submissionId && submissionOpen;

                            return (
                              <div key={team.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">{team.name}</h4>
                                    {isSoloTeam && (
                                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                        Solo
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    {acceptedMembers} / {hackathon.max_team_size} members
                                  </span>
                                </div>

                                {(() => {
                                  const subStart = new Date(hackathon.start_date);
                                  const subEnd = new Date(hackathon.end_date);
                                  const isBefore = now < subStart;
                                  const isAfter = now > subEnd;
                                  const isWindowOpen = !isBefore && !isAfter;

                                  if (team.submissionId) return null;

                                  if (isBefore) {
                                    const diff = subStart.getTime() - now.getTime();
                                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                                    const timeStr = days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

                                    return (
                                      <div className="mb-3 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                          <Clock className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs text-blue-800 font-semibold uppercase tracking-wider">Upcoming</p>
                                          <p className="text-sm text-blue-900">Project submission will start in <span className="font-bold">{timeStr}</span></p>
                                        </div>
                                      </div>
                                    );
                                  }

                                  if (isAfter) {
                                    return (
                                      <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-full">
                                          <XCircle className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div>
                                          <p className="text-xs text-red-800 font-semibold uppercase tracking-wider">Closed</p>
                                          <p className="text-sm text-red-900">Project submission period has ended</p>
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div className="mb-3">
                                      <Link
                                        href={`/freelancer/hackathons/${hackathonId}/submit-project?teamId=${team.id}`}
                                        className={`inline-flex items-center px-4 py-2 ${hasMinimumMembers && team.categoryId ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white rounded-lg transition-colors text-sm font-medium shadow-sm`}
                                        onClick={(e) => {
                                          if (!hasMinimumMembers || !team.categoryId) e.preventDefault();
                                        }}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Submit Project
                                      </Link>
                                    </div>
                                  );
                                })()}

                                {!hasMinimumMembers && !isSoloTeam && (
                                  <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                    <p className="text-xs text-yellow-800">
                                      Need at least {hackathon.min_team_size} accepted members to submit
                                    </p>
                                  </div>
                                )}

                                {isSoloTeam && !team.categoryId && !team.submissionId && (
                                  <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
                                    <p className="text-xs text-yellow-800 mb-2">
                                      ⚠️ You must select a category before submitting your project.
                                    </p>
                                    {hackathon.categories && hackathon.categories.length > 0 && (
                                      <select
                                        value={team.categoryId || ''}
                                        onChange={async (e) => {
                                          const newCategoryId = e.target.value;
                                          if (newCategoryId) {
                                            // Update team category via API
                                            try {
                                              const updateResponse = await fetch(`/api/hackquest/teams/${team.id}/update-category`, {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  categoryId: newCategoryId,
                                                  principal: userPrincipal,
                                                }),
                                              });
                                              if (updateResponse.ok) {
                                                const updateResult = await updateResponse.json();
                                                if (updateResult.success) {
                                                  alert('Category updated successfully!');
                                                  loadTeams();
                                                } else {
                                                  alert(updateResult.error || 'Failed to update category');
                                                }
                                              }
                                            } catch (error) {
                                              console.error('Error updating category:', error);
                                              alert('Failed to update category. Please try again.');
                                            }
                                          }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      >
                                        <option value="">Select a category...</option>
                                        {hackathon.categories.map((cat: any) => (
                                          <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                )}

                                {team.submissionId && (
                                  <div className="mb-3 bg-green-50 border border-green-200 rounded-lg p-2 flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      <p className="text-xs text-green-800">
                                        Project submitted
                                      </p>
                                      {winners.length > 0 && winners.some((w: any) => w.awardedSubmissionId === team.submissionId) && (
                                        <span className="text-xs bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded-full font-semibold flex items-center">
                                          <Trophy className="w-3 h-3 mr-1" />
                                          Winner!
                                        </span>
                                      )}
                                    </div>
                                    <Link
                                      href={`/freelancer/hackathons/${hackathonId}/view-project?submissionId=${team.submissionId}`}
                                      className="text-xs text-green-700 hover:text-green-900 font-medium underline flex items-center"
                                    >
                                      View Project
                                      <ExternalLink className="w-3 h-3 ml-1" />
                                    </Link>
                                  </div>
                                )}

                                <div className="space-y-2">
                                  <p className="text-sm text-gray-600">Team Members:</p>
                                  <div className="space-y-1">
                                    {team.members.map((member, idx) => (
                                      <div key={idx} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center">
                                          {member.accepted ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                                          ) : (
                                            <Clock className="w-4 h-4 text-yellow-600 mr-2" />
                                          )}
                                          <span className="text-gray-700">
                                            {member.displayName || member.email || member.principal.slice(0, 8) + '...'}
                                          </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded ${member.accepted
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                          }`}>
                                          {member.accepted ? 'Accepted' : 'Pending'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No teams yet. Create a team to get started!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Registration</h3>

              {hackathon.isOrganizer ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    You are the organizer of this hackathon and cannot register as a participant.
                  </p>
                </div>
              ) : isRegistered ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
                    <p className="text-sm text-green-800 font-medium">You are registered!</p>
                  </div>
                </div>
              ) : registrationOpen ? (
                <div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Registration closes in:</p>
                    <div className="flex gap-2 text-sm">
                      <div className="bg-gray-100 rounded px-2 py-1">
                        <span className="font-semibold">{timeRemaining.days}</span>d
                      </div>
                      <div className="bg-gray-100 rounded px-2 py-1">
                        <span className="font-semibold">{timeRemaining.hours}</span>h
                      </div>
                      <div className="bg-gray-100 rounded px-2 py-1">
                        <span className="font-semibold">{timeRemaining.minutes}</span>m
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering || !userEmail}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                  >
                    {isRegistering ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      'Register for Hackathon'
                    )}
                  </button>
                  {!userEmail && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Please login to register
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    Registration {new Date(hackathon.registration_start) > new Date() ? 'opens' : 'closed'} on{' '}
                    {formatDate(hackathon.registration_start)}
                  </p>
                </div>
              )}
            </div>

            {/* Hackathon Details */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Hackathon Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Start Date
                  </span>
                  <span className="font-medium">{formatDate(hackathon.start_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    End Date
                  </span>
                  <span className="font-medium">{formatDate(hackathon.end_date)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Location
                  </span>
                  <span className="font-medium">{hackathon.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    Team Size
                  </span>
                  <span className="font-medium">
                    {hackathon.min_team_size}-{hackathon.max_team_size} members
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Prize Pool
                  </span>
                  <span className="font-medium">{Number(hackathon.prizePool || hackathon.prize_pool || 0).toLocaleString()} ICP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Theme</span>
                  <span className="font-medium">{hackathon.theme}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Participants</span>
                  <span className="font-medium">{hackathon.participantsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Teams</span>
                  <span className="font-medium">{hackathon.teamsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Submissions</span>
                  <span className="font-medium">{hackathon.submissionsCount || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Solo Team Creation Modal */}
        {showSoloModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Go Solo</h2>
                <button
                  onClick={() => {
                    setShowSoloModal(false);
                    setSoloCategoryId('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-4">
                    Create a solo team to participate individually. You must select a category for prize eligibility.
                  </p>

                  {hackathon.categories && hackathon.categories.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Category <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={soloCategoryId}
                        onChange={(e) => setSoloCategoryId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select a category...</option>
                        {hackathon.categories.map((cat: any) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        This category determines which prize tracks you're eligible for.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowSoloModal(false);
                      setSoloCategoryId('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGoSolo}
                    disabled={isCreatingTeam || !soloCategoryId}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreatingTeam ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Solo Team'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Creation Modal */}
        {showTeamModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Create Team</h2>
                <button
                  onClick={() => setShowTeamModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Enter team name"
                  />
                </div>

                {hackathon.categories && hackathon.categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category (Optional)
                    </label>
                    <select
                      value={teamForm.categoryId}
                      onChange={(e) => setTeamForm({ ...teamForm, categoryId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {hackathon.categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Invite Team Members by Email
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Note: Members must be registered participants first
                  </p>
                  <div className="space-y-2">
                    {teamForm.inviteeEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => {
                            const newEmails = [...teamForm.inviteeEmails];
                            newEmails[index] = e.target.value;
                            setTeamForm({ ...teamForm, inviteeEmails: newEmails });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="email@example.com"
                        />
                        {teamForm.inviteeEmails.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newEmails = teamForm.inviteeEmails.filter((_, i) => i !== index);
                              setTeamForm({ ...teamForm, inviteeEmails: newEmails.length ? newEmails : [''] });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setTeamForm({ ...teamForm, inviteeEmails: [...teamForm.inviteeEmails, ''] })}
                      className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add another email
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowTeamModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateTeam}
                    disabled={isCreatingTeam || !teamForm.name.trim()}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isCreatingTeam ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Team'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
