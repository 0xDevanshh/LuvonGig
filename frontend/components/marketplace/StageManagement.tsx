'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Upload, 
  Eye,
  DollarSign,
  Calendar,
  Plus,
  Trash2,
  Edit
} from 'lucide-react'

interface Stage {
  stage_id: string
  booking_id: string
  title: string
  description: string
  amount_e8s: number
  status: 'Pending' | 'InProgress' | 'Submitted' | 'Approved' | 'Rejected' | 'Released'
  created_at: number
  updated_at: number
  submitted_at?: number
  approved_at?: number
  rejected_at?: number
  released_at?: number
  submission_notes?: string
  submission_artifacts?: string[]
  rejection_reason?: string
}

interface StageManagementProps {
  bookingId: string
  stages: Stage[]
  userType: 'freelancer' | 'client'
  userId: string
  onStageCreate?: (stageData: any) => Promise<void>
  onStageSubmit?: (stageId: string, notes: string, artifacts: string[]) => Promise<void>
  onStageApprove?: (stageId: string) => Promise<void>
  onStageReject?: (stageId: string, reason: string) => Promise<void>
  onStageRelease?: (stageId: string) => Promise<void>
  loading?: boolean
}

export function StageManagement({
  bookingId,
  stages,
  userType,
  userId,
  onStageCreate,
  onStageSubmit,
  onStageApprove,
  onStageReject,
  onStageRelease,
  loading = false
}: StageManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showSubmissionForm, setShowSubmissionForm] = useState<string | null>(null)
  const [showRejectionForm, setShowRejectionForm] = useState<string | null>(null)
  const [newStage, setNewStage] = useState({
    title: '',
    description: '',
    amount_e8s: 0
  })
  const [submissionData, setSubmissionData] = useState({
    notes: '',
    artifacts: ['']
  })
  const [rejectionReason, setRejectionReason] = useState('')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'InProgress': return 'bg-blue-100 text-blue-800'
      case 'Submitted': return 'bg-purple-100 text-purple-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      case 'Released': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'InProgress': return <Clock className="w-4 h-4 text-blue-600" />
      case 'Submitted': return <Eye className="w-4 h-4 text-purple-600" />
      case 'Approved': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Rejected': return <XCircle className="w-4 h-4 text-red-600" />
      case 'Released': return <DollarSign className="w-4 h-4 text-gray-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const handleCreateStage = async () => {
    if (!newStage.title || !newStage.description || newStage.amount_e8s <= 0) {
      alert('Please fill in all fields and enter a valid amount')
      return
    }

    if (onStageCreate) {
      await onStageCreate({
        booking_id: bookingId,
        title: newStage.title,
        description: newStage.description,
        amount_e8s: newStage.amount_e8s
      })
    }

    setNewStage({ title: '', description: '', amount_e8s: 0 })
    setShowCreateForm(false)
  }

  const handleSubmitStage = async (stageId: string) => {
    if (!submissionData.notes.trim()) {
      alert('Please provide submission notes')
      return
    }

    if (onStageSubmit) {
      await onStageSubmit(
        stageId, 
        submissionData.notes, 
        submissionData.artifacts.filter(a => a.trim())
      )
    }

    setSubmissionData({ notes: '', artifacts: [''] })
    setShowSubmissionForm(null)
  }

  const handleApproveStage = async (stageId: string) => {
    if (onStageApprove) {
      await onStageApprove(stageId)
    }
  }

  const handleRejectStage = async (stageId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason')
      return
    }

    if (onStageReject) {
      await onStageReject(stageId, rejectionReason)
    }

    setRejectionReason('')
    setShowRejectionForm(null)
  }

  const handleReleaseStage = async (stageId: string) => {
    if (onStageRelease) {
      await onStageRelease(stageId)
    }
  }

  const addArtifact = () => {
    setSubmissionData(prev => ({
      ...prev,
      artifacts: [...prev.artifacts, '']
    }))
  }

  const removeArtifact = (index: number) => {
    setSubmissionData(prev => ({
      ...prev,
      artifacts: prev.artifacts.filter((_, i) => i !== index)
    }))
  }

  const updateArtifact = (index: number, value: string) => {
    setSubmissionData(prev => ({
      ...prev,
      artifacts: prev.artifacts.map((artifact, i) => i === index ? value : artifact)
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Stages</h3>
        {userType === 'freelancer' && (
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Stage
          </Button>
        )}
      </div>

      {/* Create Stage Form */}
      {showCreateForm && userType === 'freelancer' && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Stage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stage Title *
              </label>
              <Input
                value={newStage.title}
                onChange={(e) => setNewStage(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Design Phase, Development, Testing"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <Textarea
                value={newStage.description}
                onChange={(e) => setNewStage(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what will be delivered in this stage..."
                rows={3}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (ICP) *
              </label>
              <Input
                type="number"
                value={newStage.amount_e8s / 100000000}
                onChange={(e) => setNewStage(prev => ({ 
                  ...prev, 
                  amount_e8s: Math.round(parseFloat(e.target.value || '0') * 100000000)
                }))}
                placeholder="0.00"
                step="0.01"
                className="w-full"
              />
            </div>
            <div className="flex space-x-3">
              <Button onClick={handleCreateStage} className="bg-blue-600 hover:bg-blue-700">
                Create Stage
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stages List */}
      {stages.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stages yet</h3>
            <p className="text-gray-600">
              {userType === 'freelancer' 
                ? 'Create your first project stage to get started' 
                : 'Stages will appear here once the freelancer creates them'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {stages.map((stage) => (
            <Card key={stage.stage_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{stage.title}</CardTitle>
                    <p className="text-gray-600 mt-1">{stage.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={getStatusColor(stage.status)}>
                        {stage.status}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-1" />
                        <span>{(stage.amount_e8s / 100000000).toFixed(2)} ICP</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {getStatusIcon(stage.status)}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Stage Actions */}
                <div className="space-y-4">
                  {/* Freelancer Actions */}
                  {userType === 'freelancer' && (
                    <div className="flex space-x-2">
                      {stage.status === 'InProgress' && (
                        <Button 
                          onClick={() => setShowSubmissionForm(stage.stage_id)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Submit Work
                        </Button>
                      )}
                      {stage.status === 'Pending' && (
                        <Button 
                          onClick={() => {
                            // TODO: Implement start stage functionality
                            alert('Starting stage...')
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Start Stage
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Client Actions */}
                  {userType === 'client' && (
                    <div className="flex space-x-2">
                      {stage.status === 'Submitted' && (
                        <>
                          <Button 
                            onClick={() => handleApproveStage(stage.stage_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            onClick={() => setShowRejectionForm(stage.stage_id)}
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      {stage.status === 'Approved' && (
                        <Button 
                          onClick={() => handleReleaseStage(stage.stage_id)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Release Funds
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Submission Form */}
                  {showSubmissionForm === stage.stage_id && (
                    <Card className="bg-gray-50">
                      <CardHeader>
                        <CardTitle className="text-sm">Submit Work</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Submission Notes *
                          </label>
                          <Textarea
                            value={submissionData.notes}
                            onChange={(e) => setSubmissionData(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Describe what you've delivered..."
                            rows={3}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Deliverables (URLs)
                          </label>
                          {submissionData.artifacts.map((artifact, index) => (
                            <div key={index} className="flex space-x-2 mb-2">
                              <Input
                                value={artifact}
                                onChange={(e) => updateArtifact(index, e.target.value)}
                                placeholder="https://example.com/deliverable"
                                className="flex-1"
                              />
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeArtifact(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={addArtifact}
                            className="mt-2"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Deliverable
                          </Button>
                        </div>
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleSubmitStage(stage.stage_id)}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            Submit Work
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowSubmissionForm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Rejection Form */}
                  {showRejectionForm === stage.stage_id && (
                    <Card className="bg-red-50">
                      <CardHeader>
                        <CardTitle className="text-sm text-red-800">Reject Stage</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rejection Reason *
                          </label>
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Please explain why this stage is being rejected..."
                            rows={3}
                            className="w-full"
                          />
                        </div>
                        <div className="flex space-x-3">
                          <Button 
                            onClick={() => handleRejectStage(stage.stage_id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Reject Stage
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setShowRejectionForm(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Stage Details */}
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{new Date(stage.created_at / 1000000).toLocaleDateString()}</span>
                    </div>
                    {stage.submitted_at && (
                      <div className="flex justify-between">
                        <span>Submitted:</span>
                        <span>{new Date(stage.submitted_at / 1000000).toLocaleDateString()}</span>
                      </div>
                    )}
                    {stage.approved_at && (
                      <div className="flex justify-between">
                        <span>Approved:</span>
                        <span>{new Date(stage.approved_at / 1000000).toLocaleDateString()}</span>
                      </div>
                    )}
                    {stage.rejection_reason && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-red-800">
                        <strong>Rejection Reason:</strong> {stage.rejection_reason}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

