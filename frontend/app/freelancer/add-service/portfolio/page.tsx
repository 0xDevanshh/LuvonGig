'use client'
import React, { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useServiceForm } from '@/context/ServiceFormContext'
import { AddProjectNav } from '@/components/freelancer/AddProjectNav'
import { Upload, X, Check, AlertCircle } from 'lucide-react'
import { getFilePreview, revokeFilePreview } from '@/lib/tebi-s3-upload'
interface PreviewFile {
  file: File
  preview: string
  id: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export default function AddServicePortfolio() {
  const router = useRouter()
  const {
    formData,
    updateFormData,
    uploadPortfolioImages,
    uploadingImages,
    isSaved,
    setSaved
  } = useServiceForm()

  const [dragOver, setDragOver] = useState(false)
  const [previewFiles, setPreviewFiles] = useState<PreviewFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const processFiles = useCallback((files: FileList | File[]) => {
    const newFiles: PreviewFile[] = Array.from(files).map(file => ({
      file,
      preview: getFilePreview(file),
      id: Math.random().toString(36).substr(2, 9),
      status: 'pending'
    }))

    setPreviewFiles(prev => [...prev, ...newFiles])
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      processFiles(files)
    }
  }, [processFiles])

  const removePreviewFile = useCallback((id: string) => {
    setPreviewFiles(prev => {
      const file = prev.find(f => f.id === id)
      if (file) {
        revokeFilePreview(file.preview)
      }
      return prev.filter(f => f.id !== id)
    })
  }, [])

  const uploadAllFiles = useCallback(async () => {
    const pendingFiles = previewFiles.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    console.log('Starting upload process...', { pendingFilesCount: pendingFiles.length })

    // Mark all as uploading
    setPreviewFiles(prev =>
      prev.map(f =>
        f.status === 'pending'
          ? { ...f, status: 'uploading' as const }
          : f
      )
    )

    try {
      const filesToUpload = pendingFiles.map(f => f.file)
      console.log('Files to upload:', filesToUpload.map(f => ({ name: f.name, size: f.size, type: f.type })))
      const results = await uploadPortfolioImages(filesToUpload)
      console.log('Upload results:', results)

      // Update status based on upload results
      setPreviewFiles(prev =>
        prev.map(f => {
          const resultIndex = pendingFiles.findIndex(pf => pf.id === f.id)
          if (resultIndex !== -1) {
            const result = results[resultIndex]
            return {
              ...f,
              status: result.success ? 'success' as const : 'error' as const,
              error: result.error
            }
          }
          return f
        })
      )

      // Remove successful uploads after a delay
      setTimeout(() => {
        setPreviewFiles(prev => prev.filter(f => f.status !== 'success'))
      }, 2000)

    } catch (error) {
      // Mark all as error
      setPreviewFiles(prev =>
        prev.map(f =>
          f.status === 'uploading'
            ? { ...f, status: 'error' as const, error: 'Upload failed' }
            : f
        )
      )
    }
  }, [previewFiles, uploadPortfolioImages])

  const handleContinue = useCallback(() => {
    // Upload any pending files before continuing
    const pendingFiles = previewFiles.filter(f => f.status === 'pending')
    if (pendingFiles.length > 0) {
      uploadAllFiles().then(() => {
        router.push('/freelancer/add-service/others')
      })
    } else {
      router.push('/freelancer/add-service/others')
    }
  }, [previewFiles, uploadAllFiles, router])

  const uploadedImagesCount = formData.portfolioImages.length
  const successCount = previewFiles.filter(f => f.status === 'success').length
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-1 container mx-auto py-6 px-4 max-w-5xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#161616]">
            Add Your Services
          </h1>
          <div className="text-sm text-gray-600">
            Portfolio Details: <span className="font-medium">4/5 Done</span>
            {(uploadedImagesCount > 0 || successCount > 0) && (
              <span className="ml-2 text-green-600">
                ({uploadedImagesCount + successCount} uploaded)
              </span>
            )}
          </div>
        </div>
        <AddProjectNav />

        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#161616]">
              Add Images For Your Portfolio
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Add at least 3 images to showcase your work. Upload high-quality images that represent your best projects.
            </p>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-16 flex flex-col items-center justify-center transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="mb-6">
              <Upload size={64} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Drag images here or upload from your device
            </h3>
            <p className="text-gray-500 mb-6">PNG, JPG, GIF up to 10MB each</p>
            <button
              onClick={handleBrowseClick}
              disabled={uploadingImages}
              className="px-6 py-2 bg-rainbow-gradient text-white rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages ? 'Uploading...' : 'Browse Files'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />
          </div>

          {/* Preview Files */}
          {previewFiles.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">
                  Selected Images ({previewFiles.length})
                </h3>
                <button
                  onClick={uploadAllFiles}
                  disabled={uploadingImages || previewFiles.filter(f => f.status === 'pending').length === 0}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {uploadingImages ? 'Uploading...' : 'Upload All'}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {previewFiles.map((file) => (
                  <div key={file.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={file.preview}
                        alt={file.file.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Status Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        {file.status === 'pending' && (
                          <div className="text-white text-center">
                            <Upload size={24} className="mx-auto mb-1" />
                            <span className="text-xs">Ready to upload</span>
                          </div>
                        )}
                        {file.status === 'uploading' && (
                          <div className="text-white text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-1"></div>
                            <span className="text-xs">Uploading...</span>
                          </div>
                        )}
                        {file.status === 'success' && (
                          <div className="text-white text-center">
                            <Check size={24} className="mx-auto mb-1 text-green-400" />
                            <span className="text-xs">Uploaded!</span>
                          </div>
                        )}
                        {file.status === 'error' && (
                          <div className="text-white text-center">
                            <AlertCircle size={24} className="mx-auto mb-1 text-red-400" />
                            <span className="text-xs">Failed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removePreviewFile(file.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>

                    {/* File Info */}
                    <div className="mt-2">
                      <p className="text-xs text-gray-600 truncate">{file.file.name}</p>
                      <p className="text-xs text-gray-400">
                        {(file.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                      {file.error && (
                        <p className="text-xs text-red-500 mt-1">{file.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Already Uploaded Images */}
          {formData.portfolioImages.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">
                Uploaded Images ({formData.portfolioImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.portfolioImages.map((imageUrl, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden border-2 border-green-200">
                      <img
                        src={imageUrl}
                        alt={`Portfolio image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <div className="flex justify-center mt-12">
            <button
              onClick={handleContinue}
              disabled={uploadingImages}
              className="px-12 py-3 bg-rainbow-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages ? 'Please wait...' : 'Continue'}
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}