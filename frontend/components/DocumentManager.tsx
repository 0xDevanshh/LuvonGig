'use client'
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Upload,
  Eye,
  Calendar,
  User,
  File,
  Image,
  Video,
  Archive,
  Plus,
  Search,
  Filter
} from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video' | 'archive' | 'other';
  size: number;
  uploadedBy: string;
  uploadedAt: number;
  stageId?: string;
  stageName?: string;
  description?: string;
  url?: string;
}

interface DocumentManagerProps {
  documents: Document[];
  stages: any[];
  onUploadDocument?: (files: FileList, stageId?: string) => void;
  onViewDocument?: (document: Document) => void;
  onDownloadDocument?: (document: Document) => void;
  loading?: boolean;
}

// Helper function to get file icon based on type
const getFileIcon = (type: string) => {
  switch (type) {
    case 'document': return <FileText className="w-5 h-5 text-blue-500" />;
    case 'image': return <Image className="w-5 h-5 text-green-500" />;
    case 'video': return <Video className="w-5 h-5 text-purple-500" />;
    case 'archive': return <Archive className="w-5 h-5 text-orange-500" />;
    default: return <File className="w-5 h-5 text-gray-500" />;
  }
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to get status color based on stage
const getStageColor = (stageStatus?: string) => {
  switch (stageStatus) {
    case 'Released': return 'bg-green-100 text-green-800 border-green-200';
    case 'Approved': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Submitted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function DocumentManager({
  documents,
  stages,
  onUploadDocument,
  onViewDocument,
  onDownloadDocument,
  loading = false
}: DocumentManagerProps) {
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Filter documents based on selected stage and search query
  const filteredDocuments = documents.filter(doc => {
    const matchesStage = selectedStage === 'all' || doc.stageId === selectedStage;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStage && matchesSearch;
  });

  // Group documents by stage
  const documentsByStage = selectedStage === 'all'
    ? stages.map(stage => ({
        stage,
        documents: filteredDocuments.filter(doc => doc.stageId === stage.stage_id)
      }))
    : [{
        stage: stages.find(s => s.stage_id === selectedStage),
        documents: filteredDocuments
      }];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0 && onUploadDocument) {
      onUploadDocument(files, selectedStage === 'all' ? undefined : selectedStage);
      event.target.value = ''; // Reset input
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & Deliverables
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500">Loading documents...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documents & Deliverables
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadModalOpen(!uploadModalOpen)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Upload Section */}
        {uploadModalOpen && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-900">Upload Documents</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setUploadModalOpen(false)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Select Stage (Optional)
                </label>
                <select
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">General Project Documents</option>
                  {stages.map(stage => (
                    <option key={stage.stage_id} value={stage.stage_id}>
                      Stage {stage.stage_number}: {stage.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Choose Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="w-full border border-blue-300 rounded-md px-3 py-2 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Stages</option>
            {stages.map(stage => (
              <option key={stage.stage_id} value={stage.stage_id}>
                Stage {stage.stage_number}: {stage.title}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedStage !== 'all'
                ? 'No documents match your filters.'
                : 'Upload your first document or wait for freelancer deliverables.'
              }
            </p>
            {!searchQuery && selectedStage === 'all' && (
              <Button onClick={() => setUploadModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {documentsByStage.map(({ stage, documents }) => (
              <div key={stage?.stage_id || 'general'} className="space-y-3">
                {stage && (
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">
                      Stage {stage.stage_number}: {stage.title}
                    </h4>
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStageColor(stage.status)}`}
                    >
                      {stage.status}
                    </Badge>
                  </div>
                )}

                {documents.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      No documents for this {stage ? 'stage' : 'category'}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {documents.map(document => (
                      <div
                        key={document.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {getFileIcon(document.type)}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium text-gray-900 truncate">
                              {document.name}
                            </h5>
                            {document.description && (
                              <p className="text-sm text-gray-500 truncate">
                                {document.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {document.uploadedBy}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(document.uploadedAt / 1000000).toLocaleDateString()}
                              </span>
                              <span>{formatFileSize(document.size)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {onViewDocument && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDocument(document)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          {onDownloadDocument && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDownloadDocument(document)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Document Summary */}
        {filteredDocuments.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing {filteredDocuments.length} of {documents.length} documents
              </div>
              <div className="flex items-center gap-4">
                <span>Types:</span>
                <div className="flex items-center gap-2">
                  {['document', 'image', 'video', 'archive'].map(type => {
                    const count = documents.filter(d => d.type === type).length;
                    return count > 0 ? (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}: {count}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}