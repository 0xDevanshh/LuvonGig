'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ChevronLeft, ExternalLink, Image as ImageIcon, Calendar, Code, Globe, FileText, Edit2, Save, X } from 'lucide-react';
import Link from 'next/link';

interface Submission {
  id: string;
  hackathonId: string;
  teamId: string;
  categoryId: string | null;
  title: string;
  summary: string;
  description: string;
  repoUrl: string;
  demoUrl: string;
  gallery: string[];
  submittedAt: number;
  status: { Draft?: null; Submitted?: null; UnderReview?: null; Selected?: null; Rejected?: null };
}

interface Hackathon {
  id: string;
  title: string;
  organizer: string;
}

interface Team {
  id: string;
  name: string;
  leader: string;
  members: Array<{
    principal: string;
    accepted: boolean;
  }>;
}

export default function ViewProjectPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const hackathonId = params.id;
  const submissionId = searchParams.get('submissionId');

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [hackathon, setHackathon] = useState<Hackathon | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userPrincipal, setUserPrincipal] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    summary: '',
    description: '',
    repoUrl: '',
    demoUrl: '',
  });

  // Get user principal from email
  useEffect(() => {
    const getUserPrincipal = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/session');
        if (sessionResponse.ok) {
          const sessionData = await sessionResponse.json();
          if (sessionData.success && sessionData.session?.email) {
            const principalResponse = await fetch(
              `/api/hackquest/participants/email-to-principal?email=${encodeURIComponent(sessionData.session.email)}`
            );
            if (principalResponse.ok) {
              const principalData = await principalResponse.json();
              if (principalData.success && principalData.principal) {
                setUserPrincipal(principalData.principal);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error getting user principal:', error);
      }
    };
    getUserPrincipal();
  }, []);

  useEffect(() => {
    if (!submissionId || !hackathonId) {
      setError('Submission ID and Hackathon ID are required');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load hackathon details
        const hackathonResponse = await fetch(`/api/hackquest/hackathon/${hackathonId}`);
        if (hackathonResponse.ok) {
          const hackathonData = await hackathonResponse.json();
          if (hackathonData.success) {
            setHackathon({
              id: hackathonData.data.hackathon_id,
              title: hackathonData.data.title,
              organizer: hackathonData.data.organizer,
            });
          }
        }

        // Load submission details
        const submissionResponse = await fetch(
          `/api/hackquest/submission/${submissionId}?hackathonId=${hackathonId}`
        );
        if (!submissionResponse.ok) {
          const errorData = await submissionResponse.json();
          throw new Error(errorData.error || 'Failed to load submission');
        }

        const submissionData = await submissionResponse.json();
        if (submissionData.success) {
          setSubmission(submissionData.data);
          // Initialize edit form with current values
          setEditForm({
            title: submissionData.data.title,
            summary: submissionData.data.summary,
            description: submissionData.data.description,
            repoUrl: submissionData.data.repoUrl,
            demoUrl: submissionData.data.demoUrl,
          });

          // Load team details
          const teamsResponse = await fetch(`/api/hackquest/teams?hackathonId=${hackathonId}`);
          if (teamsResponse.ok) {
            const teamsData = await teamsResponse.json();
            // The API returns { success: true, teams: [...] }
            const teamList = teamsData.teams || teamsData.data || [];
            if (teamsData.success && Array.isArray(teamList)) {
              const foundTeam = teamList.find((t: Team) => t.id === submissionData.data.teamId);
              if (foundTeam) {
                setTeam(foundTeam);
              }
            }
          }
        } else {
          throw new Error(submissionData.error || 'Failed to load submission');
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [submissionId, hackathonId]);

  const getStatusInfo = (status: Submission['status']) => {
    if (status.Draft !== undefined) return { text: 'Draft', color: 'bg-gray-100 text-gray-800' };
    if (status.Submitted !== undefined) return { text: 'Submitted', color: 'bg-blue-100 text-blue-800' };
    if (status.UnderReview !== undefined) return { text: 'Under Review', color: 'bg-yellow-100 text-yellow-800' };
    if (status.Selected !== undefined) return { text: 'Selected', color: 'bg-green-100 text-green-800' };
    if (status.Rejected !== undefined) return { text: 'Rejected', color: 'bg-red-100 text-red-800' };
    return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    const date = new Date(Number(timestamp) / 1_000_000); // Convert nanoseconds to milliseconds
    return date.toLocaleString();
  };

  const handleEdit = () => {
    if (submission) {
      setEditForm({
        title: submission.title,
        summary: submission.summary,
        description: submission.description,
        repoUrl: submission.repoUrl,
        demoUrl: submission.demoUrl,
      });
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (submission) {
      setEditForm({
        title: submission.title,
        summary: submission.summary,
        description: submission.description,
        repoUrl: submission.repoUrl,
        demoUrl: submission.demoUrl,
      });
    }
  };

  const handleSave = async () => {
    if (!submission || !userPrincipal) {
      alert('Please login to edit submission');
      return;
    }

    if (!editForm.title.trim() || !editForm.summary.trim() || !editForm.description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const response = await fetch(`/api/hackquest/submission/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          principal: userPrincipal,
          title: editForm.title.trim(),
          summary: editForm.summary.trim(),
          description: editForm.description.trim(),
          repoUrl: editForm.repoUrl.trim(),
          demoUrl: editForm.demoUrl.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSubmission(result.data);
        setIsEditing(false);
        alert('Submission updated successfully!');
      } else {
        setError(result.error || 'Failed to update submission');
      }
    } catch (err) {
      console.error('Error updating submission:', err);
      setError('Failed to update submission. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const canEdit = () => {
    if (!submission || !userPrincipal || !hackathon) return false;
    
    // 1. Hide from organizer - they should only view, not edit
    if (userPrincipal === hackathon.organizer) return false;

    // 2. Only show to team members (leader or accepted members)
    const isMember = team && (
      team.leader === userPrincipal || 
      team.members.some(m => m.principal === userPrincipal && m.accepted)
    );
    
    if (!isMember) return false;

    // 3. Status check - allow editing if not in final judging/completed stages
    const status = submission.status;
    return status.Draft !== undefined || 
           status.Submitted !== undefined || 
           status.UnderReview !== undefined ||
           status.Rejected !== undefined;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
              <p className="text-red-600 mb-6">{error || 'Submission not found'}</p>
              <Link
                href={`/freelancer/hackathons/${hackathonId}`}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
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

  const statusInfo = getStatusInfo(submission.status);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/freelancer/hackathons/${hackathonId}`}
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Hackathon
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-purple-500 focus:outline-none w-full"
                  placeholder="Enter project title"
                  required
                />
              ) : (
                <h1 className="text-3xl font-bold text-gray-900">{submission.title}</h1>
              )}
              {hackathon && (
                <p className="text-gray-600 mt-1">
                  {hackathon.title}
                  {team && ` • Team: ${team.name}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {canEdit() && !isEditing && (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                {statusInfo.text}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Summary */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Summary</h2>
            {isEditing ? (
              <textarea
                value={editForm.summary}
                onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                required
              />
            ) : (
              <p className="text-gray-700 leading-relaxed">{submission.summary}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Description</h2>
            {isEditing ? (
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={8}
                required
              />
            ) : (
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {submission.description}
              </div>
            )}
          </div>

          {/* Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Repository URL</label>
              {isEditing ? (
                <input
                  type="url"
                  value={editForm.repoUrl}
                  onChange={(e) => setEditForm({ ...editForm, repoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://github.com/..."
                />
              ) : (
                submission.repoUrl && (
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <Code className="w-5 h-5 text-purple-600 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Repository</div>
                      <div className="text-sm text-gray-500 truncate">{submission.repoUrl}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                )
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Demo URL</label>
              {isEditing ? (
                <input
                  type="url"
                  value={editForm.demoUrl}
                  onChange={(e) => setEditForm({ ...editForm, demoUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="https://demo.example.com"
                />
              ) : (
                submission.demoUrl && (
                  <a
                    href={submission.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
                  >
                    <Globe className="w-5 h-5 text-purple-600 mr-3" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Demo</div>
                      <div className="text-sm text-gray-500 truncate">{submission.demoUrl}</div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </a>
                )
              )}
            </div>
          </div>

          {/* Edit Actions */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 inline mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 inline mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Gallery */}
          {submission.gallery && submission.gallery.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Gallery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submission.gallery.map((url, index) => (
                  <div key={index} className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img
                      src={url}
                      alt={`Gallery image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-gray-600 space-x-6">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Submitted: {formatDate(submission.submittedAt)}
              </div>
              {submission.categoryId && (
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Category: {submission.categoryId}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

