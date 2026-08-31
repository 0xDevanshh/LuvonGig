'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Users, DollarSign, Clock, Search, Filter, ArrowRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Hackathon {
  id: string;
  title: string;
  tagline: string;
  description: string;
  theme: string;
  location: string;
  bannerUrl: string;
  prizePool: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  min_team_size: number;
  max_team_size: number;
  status: { Upcoming?: null; Ongoing?: null; Judging?: null; Draft?: null; Completed?: null; Cancelled?: null };
  created_at: string;
}

export default function FreelancerHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>([]);
  const [filteredHackathons, setFilteredHackathons] = useState<Hackathon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'ongoing' | 'judging'>('all');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  const router = useRouter();

  // Get user email from session
  useEffect(() => {
    const getUserEmail = async () => {
      try {
        setSessionLoading(true);
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.session && data.session.email) {
            setUserEmail(data.session.email);
          }
        }
      } catch (error) {
        console.error('Error getting user email:', error);
      } finally {
        setSessionLoading(false);
      }
    };
    getUserEmail();
  }, []);

  // Load hackathons
  const loadHackathons = useCallback(async () => {
    if (sessionLoading) return;

    try {
      setLoading(true);
      setError(null);

      const url = userEmail 
        ? `/api/hackquest/list?excludeUserEmail=${encodeURIComponent(userEmail)}`
        : '/api/hackquest/list';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch hackathons');
      }

      const data = await response.json();
      
      if (data.success) {
        setHackathons(data.hackathons || []);
        setFilteredHackathons(data.hackathons || []);
      } else {
        throw new Error(data.error || 'Failed to load hackathons');
      }
    } catch (err) {
      console.error('Error loading hackathons:', err);
      setError(err instanceof Error ? err.message : 'Failed to load hackathons');
    } finally {
      setLoading(false);
    }
  }, [userEmail, sessionLoading]);

  useEffect(() => {
    if (!sessionLoading) {
      loadHackathons();
    }
  }, [loadHackathons, sessionLoading]);

  // Filter and search
  useEffect(() => {
    let filtered = hackathons.filter(hackathon => {
      // Search filter
      const matchesSearch = searchTerm === '' ||
        hackathon.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hackathon.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hackathon.theme.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const now = new Date();
      const startDate = new Date(hackathon.start_date);
      const endDate = new Date(hackathon.end_date);
      
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'upcoming' && now < startDate) ||
        (statusFilter === 'ongoing' && now >= startDate && now <= endDate) ||
        (statusFilter === 'judging' && now > endDate); // Using 'judging' as a placeholder for completed/after end

      return matchesSearch && matchesStatus;
    });

    setFilteredHackathons(filtered);
  }, [hackathons, searchTerm, statusFilter]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusInfo = (hackathon: Hackathon) => {
    if (hackathon.status.Cancelled !== undefined && hackathon.status.Cancelled !== null) {
      return { text: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle };
    }

    const now = new Date();
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

  const isRegistrationOpen = (hackathon: Hackathon) => {
    const now = new Date();
    const regStart = new Date(hackathon.registration_start);
    const regEnd = new Date(hackathon.registration_end);
    return now >= regStart && now <= regEnd;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Hackathons</h1>
          <p className="text-gray-600">
            Discover and register for exciting hackathons. Build, learn, and compete!
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search hackathons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="judging">Judging</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {(loading || sessionLoading) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Loading hackathons...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error loading hackathons</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !sessionLoading && !error && filteredHackathons.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hackathons found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try adjusting your search terms' : 'No active hackathons available at the moment'}
            </p>
          </div>
        )}

        {/* Hackathons Grid */}
        {!loading && !sessionLoading && !error && filteredHackathons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHackathons.map((hackathon) => {
              const statusInfo = getStatusInfo(hackathon);
              const registrationOpen = isRegistrationOpen(hackathon);

              return (
                <div key={hackathon.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Banner */}
                  <div className="relative h-48 bg-gradient-to-r from-purple-500 to-pink-500">
                    {hackathon.bannerUrl && (
                      <img
                        src={hackathon.bannerUrl}
                        alt={hackathon.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-4 right-4">
                      {(() => {
                        const StatusIcon = statusInfo.icon;
                        return (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.text}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {hackathon.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {hackathon.tagline || hackathon.description}
                    </p>

                    <div className="space-y-2 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {hackathon.location}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(hackathon.start_date)} - {formatDate(hackathon.end_date)}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Team size: {hackathon.min_team_size}-{hackathon.max_team_size}
                      </div>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Prize: {Number(hackathon.prizePool).toLocaleString()} ICP
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        {registrationOpen ? (
                          <span className="text-green-600 font-medium">Registration Open</span>
                        ) : (
                          <span>Reg: {formatDate(hackathon.registration_start)}</span>
                        )}
                      </div>
                      <Link
                        href={`/freelancer/hackathons/${hackathon.id}`}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      >
                        View Details
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
