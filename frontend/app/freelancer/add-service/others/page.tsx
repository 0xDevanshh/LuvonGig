'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useServiceForm } from '@/context/ServiceFormContext'
import { AddProjectNav } from '@/components/freelancer/AddProjectNav'
import {
  Plus,
  Circle,
  CheckCircle,
  Square,
  ChevronDown,
  File,
  X,
  AlertCircle,
  Check,
} from 'lucide-react'
export default function AddServiceOthers() {
  const router = useRouter()
  const {
    formData,
    updateFormData,
    submitService,
    isSubmitting,
    submissionError,
    createdServiceId
  } = useServiceForm()
  const [showQuestionTypes, setShowQuestionTypes] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState('')
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [submittedSuccessfully, setSubmittedSuccessfully] = useState(false)

  // FAQ State
  const [showFaqForm, setShowFaqForm] = useState(false)
  const [faqQuestion, setFaqQuestion] = useState('')
  const [faqAnswer, setFaqAnswer] = useState('')
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null)
  const [editingFaqQuestion, setEditingFaqQuestion] = useState('')
  const [editingFaqAnswer, setEditingFaqAnswer] = useState('')

  const handleAddQuestion = (type: string) => {
    if (!currentQuestion.trim()) {
      alert('Please enter a question before adding')
      return
    }

    const question = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      question: currentQuestion.trim(),
      required: false
    }

    updateFormData({
      clientQuestions: [...formData.clientQuestions, question]
    })

    setCurrentQuestion('')
    setShowQuestionTypes(false)
  }

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.clientQuestions.filter((_, i) => i !== index)
    updateFormData({ clientQuestions: updatedQuestions })
  }

  const startEditingQuestion = (question: any) => {
    setEditingQuestionId(question.id)
    setEditingText(question.question)
  }

  const saveEditedQuestion = () => {
    if (!editingText.trim()) {
      alert('Question cannot be empty')
      return
    }

    const updatedQuestions = formData.clientQuestions.map(q =>
      q.id === editingQuestionId
        ? { ...q, question: editingText.trim() }
        : q
    )

    updateFormData({ clientQuestions: updatedQuestions })
    setEditingQuestionId(null)
    setEditingText('')
  }

  const cancelEditing = () => {
    setEditingQuestionId(null)
    setEditingText('')
  }

  const toggleQuestionRequired = (index: number) => {
    const updatedQuestions = formData.clientQuestions.map((q, i) =>
      i === index ? { ...q, required: !q.required } : q
    )
    updateFormData({ clientQuestions: updatedQuestions })
  }

  // FAQ Functions
  const handleAddFaq = () => {
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      alert('Please fill in both question and answer')
      return
    }

    const newFaq = {
      id: Math.random().toString(36).substring(2, 9),
      question: faqQuestion.trim(),
      answer: faqAnswer.trim()
    }

    updateFormData({
      faqs: [...formData.faqs, newFaq]
    })

    setFaqQuestion('')
    setFaqAnswer('')
    setShowFaqForm(false)
  }

  const removeFaq = (index: number) => {
    const updatedFaqs = formData.faqs.filter((_, i) => i !== index)
    updateFormData({ faqs: updatedFaqs })
  }

  const startEditingFaq = (faq: any) => {
    setEditingFaqId(faq.id)
    setEditingFaqQuestion(faq.question)
    setEditingFaqAnswer(faq.answer)
  }

  const saveEditedFaq = () => {
    if (!editingFaqQuestion.trim() || !editingFaqAnswer.trim()) {
      alert('Both question and answer are required')
      return
    }

    const updatedFaqs = formData.faqs.map(f =>
      f.id === editingFaqId
        ? { ...f, question: editingFaqQuestion.trim(), answer: editingFaqAnswer.trim() }
        : f
    )

    updateFormData({ faqs: updatedFaqs })
    setEditingFaqId(null)
    setEditingFaqQuestion('')
    setEditingFaqAnswer('')
  }

  const cancelEditingFaq = () => {
    setEditingFaqId(null)
    setEditingFaqQuestion('')
    setEditingFaqAnswer('')
  }

  const handleSubmitService = async () => {
    // Get user email from session
    let userEmail: string | null = null;
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (data.success && data.session) {
        userEmail = data.session.email;
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }

    if (!userEmail) {
      alert('Please log in to submit your service')
      return
    }

    const result = await submitService(userEmail)

    if (result.success) {
      setSubmittedSuccessfully(true)
    } else {
      // Error is already handled by the context
      console.error('Submission failed:', result.error)
    }
  }

  const handleContinue = () => {
    // Navigate to preview page instead of submitting directly
    router.push('/freelancer/add-service/service-preview')
  }
  return (
    <div className="flex flex-col min-h-screen bg-white">
     
      <main className="flex-1 container mx-auto py-6 px-4 max-w-5xl">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#161616]">
            Add Your Services
          </h1>
          <div className="text-sm text-gray-600">
            Others Details: <span className="font-medium">5/5 Done</span>
          </div>
        </div>
        <AddProjectNav />
        <div className="mt-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#161616]">
              Client Requirements (Optional)
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Add questions you'd like clients to answer when booking your service.
            </p>
          </div>

          {/* Questions List */}
          {formData.clientQuestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Client Questions ({formData.clientQuestions.length})
              </h3>
              <div className="space-y-2">
                {formData.clientQuestions.map((question, index) => (
                  <div key={question.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {editingQuestionId === question.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditedQuestion}
                            className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {question.type === 'text' && <Circle size={16} className="text-blue-500" />}
                          {question.type === 'mcq' && <CheckCircle size={16} className="text-green-500" />}
                          {question.type === 'checkbox' && <Square size={16} className="text-purple-500" />}
                          {question.type === 'dropdown' && <ChevronDown size={16} className="text-orange-500" />}
                          {question.type === 'file' && <File size={16} className="text-red-500" />}

                          <div className="flex-1">
                            <div className="text-sm text-gray-700 font-medium">{question.question}</div>
                            <div className="text-xs text-gray-500">
                              {question.type === 'text' && 'Text answer'}
                              {question.type === 'mcq' && 'Multiple choice'}
                              {question.type === 'checkbox' && 'Multiple selections'}
                              {question.type === 'dropdown' && 'Dropdown selection'}
                              {question.type === 'file' && 'File upload'}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleQuestionRequired(index)}
                              className={`px-2 py-1 text-xs rounded ${
                                question.required
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                              }`}
                            >
                              {question.required ? 'Required' : 'Optional'}
                            </button>

                            <button
                              onClick={() => startEditingQuestion(question)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit question"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>

                            <button
                              onClick={() => removeQuestion(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove question"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Question Button */}
          <div className="mb-8">
            {/* Question Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={currentQuestion}
                onChange={(e) => setCurrentQuestion(e.target.value)}
                placeholder="Enter your question here..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setShowQuestionTypes(!showQuestionTypes)
                  }
                }}
              />
              <button
                onClick={() => setShowQuestionTypes(!showQuestionTypes)}
                disabled={!currentQuestion.trim()}
                className="flex items-center gap-2 text-gray-600 border border-dashed border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={16} />
                Add Question
              </button>
            </div>

            {/* Question Type Selector */}
            {showQuestionTypes && (
              <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Choose question type:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="p-3 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                    onClick={() => handleAddQuestion('text')}
                  >
                    <Circle size={16} className="text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Text Answer</div>
                      <div className="text-xs text-gray-500">Client types a response</div>
                    </div>
                  </div>
                  <div
                    className="p-3 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                    onClick={() => handleAddQuestion('mcq')}
                  >
                    <CheckCircle size={16} className="text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Multiple Choice</div>
                      <div className="text-xs text-gray-500">Single option selection</div>
                    </div>
                  </div>
                  <div
                    className="p-3 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                    onClick={() => handleAddQuestion('checkbox')}
                  >
                    <Square size={16} className="text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Checkboxes</div>
                      <div className="text-xs text-gray-500">Multiple selections</div>
                    </div>
                  </div>
                  <div
                    className="p-3 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                    onClick={() => handleAddQuestion('dropdown')}
                  >
                    <ChevronDown size={16} className="text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">Dropdown</div>
                      <div className="text-xs text-gray-500">Select from list</div>
                    </div>
                  </div>
                  <div
                    className="p-3 flex items-center gap-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                    onClick={() => handleAddQuestion('file')}
                  >
                    <File size={16} className="text-gray-500" />
                    <div>
                      <div className="text-sm font-medium">File Upload</div>
                      <div className="text-xs text-gray-500">Client uploads file</div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowQuestionTypes(false)
                    setCurrentQuestion('')
                  }}
                  className="mt-3 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#161616]">
                Frequently Asked Questions (FAQ)
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Add common questions and answers that clients might have about your service.
              </p>
            </div>

            {/* FAQ List */}
            {formData.faqs.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  FAQ Items ({formData.faqs.length})
                </h3>
                <div className="space-y-3">
                  {formData.faqs.map((faq, index) => (
                    <div key={faq.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      {editingFaqId === faq.id ? (
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-700">Question:</label>
                            <input
                              type="text"
                              value={editingFaqQuestion}
                              onChange={(e) => setEditingFaqQuestion(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter question..."
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-700">Answer:</label>
                            <textarea
                              value={editingFaqAnswer}
                              onChange={(e) => setEditingFaqAnswer(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter answer..."
                              rows={3}
                            />
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={saveEditedFaq}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditingFaq}
                              className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-xs font-bold">Q</span>
                              </div>
                              <h4 className="font-medium text-gray-800">{faq.question}</h4>
                            </div>
                            <div className="flex items-start gap-2 ml-8">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <span className="text-white text-xs font-bold">A</span>
                              </div>
                              <p className="text-gray-700 text-sm">{faq.answer}</p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => startEditingFaq(faq)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit FAQ"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={() => removeFaq(index)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove FAQ"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add FAQ Button */}
            <div className="mb-6">
              <button
                onClick={() => setShowFaqForm(!showFaqForm)}
                className="flex items-center gap-2 text-blue-600 border border-dashed border-blue-300 rounded-full px-4 py-2 hover:bg-blue-50"
              >
                <Plus size={16} />
                ADD FAQ ITEM
              </button>

              {/* FAQ Form */}
              {showFaqForm && (
                <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New FAQ Item</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Question:</label>
                      <input
                        type="text"
                        value={faqQuestion}
                        onChange={(e) => setFaqQuestion(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="What question do clients often ask?"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Answer:</label>
                      <textarea
                        value={faqAnswer}
                        onChange={(e) => setFaqAnswer(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Provide a clear and helpful answer..."
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddFaq}
                        disabled={!faqQuestion.trim() || !faqAnswer.trim()}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add FAQ
                      </button>
                      <button
                        onClick={() => {
                          setShowFaqForm(false)
                          setFaqQuestion('')
                          setFaqAnswer('')
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Service Summary */}
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-[#161616] mb-4">Service Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service Title:</span>
                <span className="font-medium">{formData.serviceTitle || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="font-medium">{formData.mainCategory}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Package Type:</span>
                <span className="font-medium">{formData.tierMode === '3tier' ? '3 Tiers' : 'Single Tier'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Portfolio Images:</span>
                <span className="font-medium">{formData.portfolioImages.length} uploaded</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Client Questions:</span>
                <span className="font-medium">{formData.clientQuestions.length} added</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">FAQ Items:</span>
                <span className="font-medium">{formData.faqs.length} created</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {submissionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span className="font-medium">Submission Failed</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{submissionError}</p>
            </div>
          )}

          {/* Success Message */}
          {submittedSuccessfully && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <Check size={20} />
                <span className="font-medium">Service Created Successfully!</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                Your service has been published and is now available for clients to book.
                {createdServiceId && ` Service ID: ${createdServiceId}`}
              </p>
            </div>
          )}

          {/* Submit/Continue Button */}
          <div className="flex justify-center mt-12">
            <button
              onClick={handleContinue}
              className="px-12 py-3 bg-rainbow-gradient text-white rounded-full font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              Preview Service Before Publishing
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
