'use client'
import React, { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Sparkles, Eye, Edit3, HelpCircle } from 'lucide-react'

// Dynamically import the markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: number
  maxLength?: number
  showPreview?: boolean
  aiAssist?: boolean
  label?: string
  helpText?: string
  error?: string
  disabled?: boolean
  onSave?: (value: string) => void
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Describe your service in detail...",
  minHeight = 200,
  maxLength = 2000,
  showPreview = true,
  aiAssist = true,
  label,
  helpText,
  error,
  disabled = false,
  onSave
}: RichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [charCount, setCharCount] = useState(value.length)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const editorRef = useRef<any>(null)

  const handleChange = useCallback((val?: string) => {
    const newValue = val || ''
    setCharCount(newValue.length)
    onChange(newValue)
  }, [onChange])

  const togglePreview = useCallback(() => {
    setIsPreviewMode(prev => !prev)
  }, [])

  const handleAiAssist = useCallback(async () => {
    if (!value.trim() || isAiLoading) return

    setIsAiLoading(true)
    try {
      // Simple AI assistance - in a real app, this would call an AI service
      const improvements = [
        "Consider adding more specific details about your process.",
        "Think about mentioning the tools and technologies you use.",
        "Add information about your experience and qualifications.",
        "Include what makes your service unique."
      ]

      const randomTip = improvements[Math.floor(Math.random() * improvements.length)]
      alert(`AI Suggestion: ${randomTip}`)
    } catch (error) {
      console.error('AI assistance failed:', error)
    } finally {
      setIsAiLoading(false)
    }
  }, [value, isAiLoading])

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(value)
    }
  }, [onSave, value])

  // Custom toolbar commands
  const customCommands = [
    {
      name: 'bold',
      keyCommand: 'bold',
      buttonProps: { 'aria-label': 'Bold text', title: 'Bold (Ctrl+B)' },
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z" />
        </svg>
      ),
    },
    {
      name: 'italic',
      keyCommand: 'italic',
      buttonProps: { 'aria-label': 'Italic text', title: 'Italic (Ctrl+I)' },
      icon: (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z" />
        </svg>
      ),
    }
  ]

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 uppercase font-medium">
              {label}
            </label>
            {helpText && (
              <div className="group relative">
                <HelpCircle size={14} className="text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  {helpText}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs ${charCount > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
              {charCount}/{maxLength}
            </span>
          </div>
        </div>
      )}

      <div className={`relative border rounded-lg overflow-hidden ${
        error ? 'border-red-500' : 'border-gray-200'
      } ${disabled ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
        {/* Editor Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {showPreview && (
              <button
                type="button"
                onClick={togglePreview}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isPreviewMode
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
                title={isPreviewMode ? "Switch to edit mode" : "Preview"}
              >
                {isPreviewMode ? <Edit3 size={14} /> : <Eye size={14} />}
                {isPreviewMode ? 'Edit' : 'Preview'}
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {aiAssist && !disabled && (
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={isAiLoading || !value.trim()}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Get AI suggestions"
              >
                <Sparkles size={14} className={isAiLoading ? 'animate-spin' : ''} />
                {isAiLoading ? 'Thinking...' : 'Ask AI'}
              </button>
            )}

            {onSave && (
              <button
                type="button"
                onClick={handleSave}
                disabled={disabled}
                className="px-2 py-1 rounded text-xs font-medium text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save description"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Editor Content */}
        <div data-color-mode="light" className="bg-white">
          <MDEditor
            ref={editorRef}
            value={value}
            onChange={handleChange}
            preview={isPreviewMode ? 'preview' : 'edit'}
            hideToolbar={false}
            visibleDragbar={false}
            height={minHeight}
            textareaProps={{
              placeholder,
              disabled,
              style: {
                minHeight: `${minHeight}px`,
                fontSize: '14px',
                lineHeight: '1.5'
              }
            }}
            extraCommands={customCommands}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}

      {/* Markdown Help */}
      <div className="mt-2 text-xs text-gray-500">
        <p className="font-medium mb-1">Formatting tips:</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>**Bold**</span>
          <span>*Italic*</span>
          <span># Heading</span>
          <span>- List item</span>
          <span>[Link](url)</span>
          <span>`Code`</span>
        </div>
      </div>
    </div>
  )
}