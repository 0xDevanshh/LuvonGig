'use client'
import React, { useState, useEffect } from 'react';
import { Header1 } from '@/components/Header1';
import { useBookings, useStages, useProjectCompletion } from '@/hooks/useMarketplace';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatICP } from '@/lib/ic-marketplace-agent';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Upload, 
  Eye,
  DollarSign,
  Calendar
} from 'lucide-react';

export default function FreelancerBookings() {
  const [userId, setUserId] = useState<string>(''); // This should come from auth context
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { 
    bookings, 
    loading: bookingsLoading, 
    error: bookingsError, 
    fetchBookings 
  } = useBookings(userId, 'freelancer');

  const { 
    stages, 
    loading: stagesLoading, 
    error: stagesError, 
    createStages,
    submitStage,
    approveStage,
    rejectStage
  } = useStages(selectedBooking || undefined);

  const { 
    completeProject, 
    loading: completionLoading 
  } = useProjectCompletion();

  const [showStageForm, setShowStageForm] = useState(false);
  const [showSubmissionForm, setShowSubmissionForm] = useState<string | null>(null);
  const [submissionData, setSubmissionData] = useState({ notes: '', artifacts: [''] });

  useEffect(() => {
    // TODO: Get userId from auth context
    const mockUserId = 'USER123'; // Replace with actual user ID
    setUserId(mockUserId);
    
    if (mockUserId) {
      fetchBookings();
    }
  }, [fetchBookings, statusFilter]);

  const handleCreateStages = async (stageDefinitions: any[]) => {
    if (!userId || !selectedBooking) return;
    
    const result = await createStages(stageDefinitions);
    if (result) {
      setShowStageForm(false);
    }
  };

  const handleSubmitStage = async (stageId: string) => {
    if (!userId) return;
    
    const result = await submitStage(
      userId,
      stageId, 
      submissionData.notes, 
      submissionData.artifacts.filter(a => a.trim() !== '')
    );
    
    if (result) {
      setShowSubmissionForm(null);
      setSubmissionData({ notes: '', artifacts: [''] });
    }
  };

  const handleCompleteProject = async (bookingId: string) => {
    if (!userId) return;
    
    if (confirm('Are you sure you want to mark this project as complete?')) {
      await completeProject(userId, bookingId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'InProgress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Disputed': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStageStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'InProgress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Submitted': return <Upload className="w-4 h-4 text-blue-500" />;
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Released': return <DollarSign className="w-4 h-4 text-green-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (bookingsLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Header1 />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading bookings...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
        <Header1 />
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#161616]">My Bookings</h1>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="InProgress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Disputed">Disputed</option>
            </select>
          </div>
        </div>

        {bookingsError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {bookingsError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bookings List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Bookings ({bookings.length})</h2>
            {bookings.map((booking) => (
              <Card 
                key={booking.booking_id} 
                className={`border cursor-pointer transition-colors ${
                  selectedBooking === booking.booking_id 
                    ? 'border-[#0B1F36] bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedBooking(booking.booking_id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Booking #{booking.booking_id.slice(-8)}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(booking.status)}
                        <Badge 
                          variant={booking.status === 'Completed' ? 'default' : 'secondary'}
                        >
                          {booking.status}
                        </Badge>
                        <Badge 
                          variant={booking.payment_status === 'Funded' ? 'default' : 'outline'}
                        >
                          {booking.payment_status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-[#0B1F36]">
                        {formatICP(BigInt(booking.escrow_amount_e8s))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(booking.created_at / 1000000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {booking.special_instructions}
                  </p>
                  {booking.ledger_deposit_block && (
                    <div className="text-xs text-gray-500 mt-2">
                      Block: {booking.ledger_deposit_block.toString()}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stages for Selected Booking */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Project Stages {selectedBooking ? `(${stages.length})` : ''}
              </h2>
              {selectedBooking && stages.length === 0 && (
                <Button 
                  onClick={() => setShowStageForm(true)}
                  size="sm"
                  className="bg-[#0B1F36] text-white hover:bg-[#1a3a5f]"
                >
                  Create Stages
                </Button>
              )}
            </div>

            {selectedBooking ? (
              stagesLoading ? (
                <div className="text-center py-4">Loading stages...</div>
              ) : stagesError ? (
                <div className="text-red-600">{stagesError}</div>
              ) : stages.length > 0 ? (
                <div className="space-y-3">
                  {stages.map((stage, index) => (
                    <Card key={stage.stage_id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm font-medium">Stage {stage.stage_number}</span>
                              {getStageStatusIcon(stage.status)}
                              <Badge 
                                variant={stage.status === 'Released' ? 'default' : 'secondary'}
                              >
                                {stage.status}
                              </Badge>
                            </div>
                            <h3 className="font-medium">{stage.title}</h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {stage.description}
                            </p>
                            <div className="flex items-center justify-between mt-3">
                              <div className="text-sm font-semibold text-[#0B1F36]">
                                {formatICP(BigInt(stage.amount_e8s))}
                              </div>
                              <div className="flex gap-2">
                                {stage.status === 'Pending' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowSubmissionForm(stage.stage_id)}
                                  >
                                    <Upload size={12} className="mr-1" />
                                    Submit
                                  </Button>
                                )}
                                {stage.status === 'Submitted' && (
                                  <div className="text-sm text-blue-600">
                                    Awaiting client approval
                                  </div>
                                )}
                                {stage.status === 'Approved' && (
                                  <div className="text-sm text-green-600">
                                    Approved - funds released
                                  </div>
                                )}
                                {stage.status === 'Rejected' && (
                                  <div className="text-sm text-red-600">
                                    Rejected: {stage.rejection_reason}
                                  </div>
                                )}
                                {stage.status === 'Released' && (
                                  <div className="text-sm text-green-600">
                                    Funds released
                                  </div>
                                )}
                              </div>
                            </div>
                            {stage.submission_notes && (
                              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                                <strong>Submission Notes:</strong> {stage.submission_notes}
                              </div>
                            )}
                            {stage.submission_artifacts && stage.submission_artifacts.length > 0 && (
                              <div className="mt-2">
                                <div className="text-sm font-medium">Artifacts:</div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {stage.submission_artifacts?.map((artifact, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {artifact}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Complete Project Button */}
                  {stages.length > 0 && stages.every(s => s.status === 'Released') && (
                    <Card className="border border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-green-800">Project Complete</h3>
                            <p className="text-sm text-green-600">
                              All stages have been approved and funds released.
                            </p>
                          </div>
                          <Button
                            onClick={() => handleCompleteProject(selectedBooking)}
                            disabled={completionLoading}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            Mark Complete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No stages created yet. Create project stages to get started.
                </div>
              )
            ) : (
              <div className="text-center py-8 text-gray-500">
                Select a booking to view its project stages
              </div>
            )}
          </div>
        </div>

        {/* Stage Creation Form */}
        {showStageForm && (
          <StageForm
            onSubmit={handleCreateStages}
            onCancel={() => setShowStageForm(false)}
          />
        )}

        {/* Stage Submission Form */}
        {showSubmissionForm && (
          <SubmissionForm
            stageId={showSubmissionForm}
            onSubmit={handleSubmitStage}
            onCancel={() => setShowSubmissionForm(null)}
          />
        )}
      </main>
    </div>
  );
}

// Stage Form Component
function StageForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (stages: any[]) => void; 
  onCancel: () => void; 
}) {
  const [stages, setStages] = useState([
    { title: '', description: '', amount_e8s: 0 }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(stages);
  };

  const addStage = () => {
    setStages([...stages, { title: '', description: '', amount_e8s: 0 }]);
  };

  const updateStage = (index: number, field: string, value: any) => {
    const newStages = [...stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setStages(newStages);
  };

  const removeStage = (index: number) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create Project Stages</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {stages.map((stage, index) => (
            <Card key={index} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Stage {index + 1}</h3>
                  {stages.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeStage(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Stage Title</label>
                    <input
                      type="text"
                      value={stage.title}
                      onChange={(e) => updateStage(index, 'title', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (ICP)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={stage.amount_e8s / 100_000_000}
                      onChange={(e) => updateStage(index, 'amount_e8s', Math.floor(parseFloat(e.target.value || '0') * 100_000_000))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={stage.description}
                    onChange={(e) => updateStage(index, 'description', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                    required
                  />
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={addStage}
            className="w-full"
          >
            Add Another Stage
          </Button>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0B1F36] text-white">
              Create Stages
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Submission Form Component
function SubmissionForm({ 
  stageId,
  onSubmit, 
  onCancel 
}: { 
  stageId: string;
  onSubmit: (stageId: string) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    notes: '',
    artifacts: ['']
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(stageId);
  };

  const addArtifact = () => {
    setFormData({ ...formData, artifacts: [...formData.artifacts, ''] });
  };

  const updateArtifact = (index: number, value: string) => {
    const newArtifacts = [...formData.artifacts];
    newArtifacts[index] = value;
    setFormData({ ...formData, artifacts: newArtifacts });
  };

  const removeArtifact = (index: number) => {
    if (formData.artifacts.length > 1) {
      const newArtifacts = formData.artifacts.filter((_, i) => i !== index);
      setFormData({ ...formData, artifacts: newArtifacts });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Submit Stage Work</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Submission Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
              placeholder="Describe what you've completed for this stage..."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Artifacts/Deliverables</label>
            {formData.artifacts.map((artifact, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={artifact}
                  onChange={(e) => updateArtifact(index, e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="URL or description of deliverable"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeArtifact(index)}
                  disabled={formData.artifacts.length === 1}
                >
                  Remove
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addArtifact}
              className="mt-2"
            >
              Add Artifact
            </Button>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0B1F36] text-white">
              Submit Stage
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
