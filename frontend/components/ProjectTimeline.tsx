'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';

interface Stage {
  stage_id: string;
  stage_number: number;
  title: string;
  description: string;
  status: string;
  amount_e8s: number;
  created_at: number;
  submission_notes?: string;
  rejection_reason?: string;
  submission_artifacts?: string[];
}

interface ProjectTimelineProps {
  stages: Stage[];
  onApproveStage?: (stageId: string) => void;
  onRejectStage?: (stageId: string, reason: string) => void;
  loading?: boolean;
  error?: string;
}

// Helper function to get stage status icon
const getStageStatusIcon = (status: string) => {
  switch (status) {
    case 'Pending': return <Clock className="w-5 h-5 text-yellow-500" />;
    case 'InProgress': return <Clock className="w-5 h-5 text-blue-500" />;
    case 'Submitted': return <AlertCircle className="w-5 h-5 text-blue-500" />;
    case 'Approved': return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'Rejected': return <XCircle className="w-5 h-5 text-red-500" />;
    case 'Released': return <DollarSign className="w-5 h-5 text-green-500" />;
    default: return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

// Helper function to get stage status color
const getStageStatusColor = (status: string) => {
  switch (status) {
    case 'Pending': return 'border-yellow-200 bg-yellow-50';
    case 'InProgress': return 'border-blue-200 bg-blue-50';
    case 'Submitted': return 'border-blue-300 bg-blue-100';
    case 'Approved': return 'border-green-200 bg-green-50';
    case 'Rejected': return 'border-red-200 bg-red-50';
    case 'Released': return 'border-green-300 bg-green-100';
    default: return 'border-gray-200 bg-gray-50';
  }
};

// Helper function to get connector line style
const getConnectorLineStyle = (currentStatus: string, nextStatus: string) => {
  const isCompleted = currentStatus === 'Released' || currentStatus === 'Approved';
  const nextIsActive = nextStatus === 'Submitted' || nextStatus === 'InProgress';

  if (isCompleted) {
    return 'bg-green-500';
  } else if (nextIsActive) {
    return 'bg-blue-500';
  } else {
    return 'bg-gray-300';
  }
};

export default function ProjectTimeline({
  stages,
  onApproveStage,
  onRejectStage,
  loading = false,
  error = ''
}: ProjectTimelineProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading timeline...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-red-600">{error}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stages || stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Project Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No stages created yet.</p>
              <p className="text-sm">The freelancer will create project stages soon.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort stages by stage number
  const sortedStages = [...stages].sort((a, b) => a.stage_number - b.stage_number);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Project Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline container */}
          <div className="space-y-6">
            {sortedStages.map((stage, index) => (
              <div key={stage.stage_id} className="relative">
                {/* Stage content */}
                <div className={`relative border rounded-lg p-4 ${getStageStatusColor(stage.status)}`}>
                  {/* Stage number badge */}
                  <div className="absolute -top-3 -left-3">
                    <div className="bg-white border-2 border-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      {stage.stage_number}
                    </div>
                  </div>

                  {/* Stage header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 mt-1">
                      {getStageStatusIcon(stage.status)}
                      <h3 className="font-semibold">{stage.title}</h3>
                      <Badge
                        variant={stage.status === 'Released' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {stage.status}
                      </Badge>
                    </div>
                    <div className="text-right">
                      {stage.amount_e8s && (
                        <div className="text-sm font-semibold text-[#0B1F36]">
                          ${(Number(stage.amount_e8s) / 100000000).toFixed(2)} USD
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        {new Date(stage.created_at / 1000000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Stage description */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                    {stage.description}
                  </p>

                  {/* Submission details */}
                  {stage.submission_notes && (
                    <div className="mb-3 p-3 bg-white bg-opacity-70 rounded border">
                      <div className="text-sm font-medium mb-1">Submission Notes:</div>
                      <p className="text-sm text-gray-700">{stage.submission_notes}</p>
                    </div>
                  )}

                  {/* Rejection reason */}
                  {stage.rejection_reason && (
                    <div className="mb-3 p-3 bg-red-100 rounded border border-red-200">
                      <div className="text-sm font-medium text-red-800 mb-1">Rejection Reason:</div>
                      <p className="text-sm text-red-700">{stage.rejection_reason}</p>
                    </div>
                  )}

                  {/* Submission artifacts */}
                  {stage.submission_artifacts && stage.submission_artifacts.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium mb-2">Deliverables:</div>
                      <div className="flex flex-wrap gap-1">
                        {stage.submission_artifacts.map((artifact, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-white bg-opacity-70">
                            {artifact}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {stage.status === 'Submitted' && (
                        <div className="flex gap-2">
                          {onApproveStage && (
                            <button
                              onClick={() => onApproveStage(stage.stage_id)}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                            >
                              Approve & Release Funds
                            </button>
                          )}
                          {onRejectStage && (
                            <button
                              onClick={() => {
                                const reason = prompt('Please provide rejection reason:');
                                if (reason && reason.trim()) {
                                  onRejectStage(stage.stage_id, reason.trim());
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                      {stage.status === 'Approved' && (
                        <div className="text-sm text-green-700 font-medium">
                          ✓ Approved - Funds will be released
                        </div>
                      )}
                      {stage.status === 'Released' && (
                        <div className="text-sm text-green-700 font-medium">
                          ✓ Funds Released
                        </div>
                      )}
                      {stage.status === 'Rejected' && (
                        <div className="text-sm text-red-700 font-medium">
                          ✗ Rejected - Freelancer needs to revise
                        </div>
                      )}
                      {stage.status === 'Pending' && (
                        <div className="text-sm text-yellow-700">
                          ⏳ Awaiting freelancer submission
                        </div>
                      )}
                      {stage.status === 'InProgress' && (
                        <div className="text-sm text-blue-700">
                          🔄 Work in progress
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Connector line to next stage */}
                {index < sortedStages.length - 1 && (
                  <div className="flex justify-center py-2">
                    <div className={`w-0.5 h-6 ${getConnectorLineStyle(stage.status, sortedStages[index + 1].status)}`}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                Pending
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                In Progress
              </span>
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Completed
              </span>
            </div>
            <div className="text-gray-500">
              Total Stages: {sortedStages.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}