'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  Image as ImageIcon,
  Plus,
  X,
} from 'lucide-react';
import { getPrincipalFromEmail } from '@/lib/principal-utils';

interface Team {
  id: string;
  name: string;
  categoryId: string | null;
  hackathonId: string;
}

interface Hackathon {
  id: string;
  title: string;
  submissionsOpenAt: number;
  submissionsCloseAt: number;
  categories?: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

export default function SubmitProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const hackathonId = params.id;
  const teamId = searchParams.get('teamId');

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    repoUrl: '',
    demoUrl: '',
    gallery: [''] as string[],
  });

  // Get user email
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.session?.email) {
            setUserEmail(sessionData.session.email);
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };
    getUserInfo();
  }, []);

  // Get principal from email
  useEffect(() => {
    const getPrincipal = async () => {
      if (!userEmail) return;

      try {
        const principal = getPrincipalFromEmail(userEmail);
        setUserPrincipal(principal.toText());
      } catch (error) {
        console.error('Error getting principal:', error);
      }
    };

    if (userEmail) {
      getPrincipal();
    }
  }, [hackathonId, userEmail]);

  // Load hackathon details
  useEffect(() => {
    const loadHackathon = async () => {
      if (!hackathonId) return;

      try {
        const hackathonResponse = await fetch(`/api/hackquest/hackathon/${hackathonId}`);
        if (hackathonResponse.ok) {
          const hackathonData = await hackathonResponse.json();
          if (hackathonData.success) {
            setHackathon({
              id: hackathonData.data.id,
              title: hackathonData.data.title,
              submissionsOpenAt: hackathonData.data.submissionsOpenAt,
              submissionsCloseAt: hackathonData.data.submissionsCloseAt,
              categories: hackathonData.data.categories || [],
            });
          }
        }
      } catch (error) {
        console.error('Error loading hackathon:', error);
      }
    };

    loadHackathon();
  }, [hackathonId]);

  // Load team details
  useEffect(() => {
    const loadTeam = async () => {
      if (!hackathonId || !teamId || !userPrincipal) return;

      try {
        setLoading(true);
        setError(null);

        const teamsResponse = await fetch(`/api/hackquest/teams?hackathonId=${encodeURIComponent(hackathonId)}&principal=${encodeURIComponent(userPrincipal)}`);
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          if (teamsData.success) {
            const foundTeam = teamsData.teams.find((t: Team) => t.id === teamId);
            if (foundTeam) {
              setTeam(foundTeam);
            } else {
              setError('Team not found or you are not a member');
            }
          }
        }
      } catch (err) {
        console.error('Error loading team:', err);
        setError('Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    if (userPrincipal) {
      loadTeam();
    }
  }, [hackathonId, teamId, userPrincipal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userEmail || !userPrincipal || !team) {
      alert('Please login to submit a project');
      return;
    }

    if (!formData.title.trim() || !formData.summary.trim() || !formData.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (!formData.repoUrl.trim() && !formData.demoUrl.trim()) {
      alert('Please provide at least a repository URL or demo URL');
      return;
    }

    // Check if team has a category (required for submission)
    if (!team.categoryId) {
      alert('Your team must have a category assigned before submitting. Please go back and select a category for your team.');
      return;
    }

    // Check if submission window is open
    if (hackathon) {
      const now = Date.now() * 1_000_000; // Convert to nanoseconds
      if (now < hackathon.submissionsOpenAt || now > hackathon.submissionsCloseAt) {
        alert('Submission window is closed');
        return;
      }
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/hackquest/submit-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: team.id,
          principal: userPrincipal,
          ...formData,
          gallery: formData.gallery.filter(url => url.trim()),
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('Project submitted successfully!');
        router.push(`/freelancer/hackathons/${hackathonId}`);
      } else {
        setError(result.error || 'Failed to submit project');
      }
    } catch (err) {
      console.error('Error submitting project:', err);
      setError('Failed to submit project. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="ml-3 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error && !team) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <div className="mt-4">
              <Link
                href={`/freelancer/hackathons/${hackathonId}`}
                className="inline-flex items-center text-purple-600 hover:text-purple-700"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back to Hackathon
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/freelancer/hackathons/${hackathonId}`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Hackathon
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Submit Project</h1>
          {hackathon && (
            <p className="text-gray-600 mt-2">Hackathon: {hackathon.title}</p>
          )}
          {team && (
            <p className="text-gray-600">Team: {team.name}</p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Category Warning */}
        {team && !team.categoryId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Category Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your team must have a category assigned before submitting. Select a category below or go back to the hackathon page.
                </p>
                {hackathon && hackathon.categories && hackathon.categories.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                      Select Category:
                    </label>
                    <select
                      value=""
                      onChange={async (e) => {
                        const newCategoryId = e.target.value;
                        if (newCategoryId && userPrincipal) {
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
                                // Reload team data
                                const teamsResponse = await fetch(`/api/hackquest/teams?hackathonId=${encodeURIComponent(hackathonId)}&principal=${encodeURIComponent(userPrincipal)}`);
                                if (teamsResponse.ok) {
                                  const teamsData = await teamsResponse.json();
                                  if (teamsData.success) {
                                    const foundTeam = teamsData.teams.find((t: Team) => t.id === team.id);
                                    if (foundTeam) {
                                      setTeam(foundTeam);
                                    }
                                  }
                                }
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
                      className="w-full px-3 py-2 border border-yellow-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent bg-white"
                    >
                      <option value="">Select a category...</option>
                      {hackathon.categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <Link
                  href={`/freelancer/hackathons/${hackathonId}`}
                  className="inline-block mt-3 text-sm text-yellow-800 underline hover:text-yellow-900"
                >
                  Or go back to hackathon page
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Submission Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your project title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Brief summary of your project (2-3 sentences)"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Detailed description of your project, features, technologies used, etc."
              rows={8}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Repository URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <LinkIcon className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="url"
                value={formData.repoUrl}
                onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://github.com/username/project"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Demo URL
            </label>
            <div className="flex items-center">
              <LinkIcon className="w-4 h-4 text-gray-400 mr-2" />
              <input
                type="url"
                value={formData.demoUrl}
                onChange={(e) => setFormData({ ...formData, demoUrl: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://your-demo-url.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Gallery Images (URLs)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Add URLs to images showcasing your project
            </p>
            <div className="space-y-2">
              {formData.gallery.map((url, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex items-center flex-1">
                    <ImageIcon className="w-4 h-4 text-gray-400 mr-2" />
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        const newGallery = [...formData.gallery];
                        newGallery[index] = e.target.value;
                        setFormData({ ...formData, gallery: newGallery });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="https://example.com/image.png"
                    />
                  </div>
                  {formData.gallery.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newGallery = formData.gallery.filter((_, i) => i !== index);
                        setFormData({ ...formData, gallery: newGallery.length ? newGallery : [''] });
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
                onClick={() => setFormData({ ...formData, gallery: [...formData.gallery, ''] })}
                className="text-sm text-purple-600 hover:text-purple-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add another image URL
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Link
              href={`/freelancer/hackathons/${hackathonId}`}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !userEmail}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Submit Project
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

