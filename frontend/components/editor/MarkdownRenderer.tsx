'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import MarkdownPreview from '@uiw/react-markdown-preview'

// Dynamically import to avoid SSR issues
const MarkdownPreviewComponent = dynamic(
  () => import('@uiw/react-markdown-preview').then((mod) => mod.default),
  { ssr: false }
)

interface MarkdownRendererProps {
  content: string
  className?: string
  style?: React.CSSProperties
  allowHtml?: boolean
  skipHtml?: boolean
}

export default function MarkdownRenderer({
  content,
  className = '',
  style,
  allowHtml = false,
  skipHtml = true
}: MarkdownRendererProps) {
  if (!content || typeof content !== 'string') {
    return (
      <div className={`text-gray-500 ${className}`} style={style}>
        No description provided
      </div>
    )
  }

  // Custom styles for markdown rendering
  const customStyles = {
    ...style,
    backgroundColor: 'transparent',
    color: 'inherit',
    fontSize: '14px',
    lineHeight: '1.6'
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      style={customStyles}
      data-color-mode="light"
    >
      <MarkdownPreviewComponent
        source={content}
        style={customStyles}
        skipHtml={skipHtml}
      />
    </div>
  )
}

// Export a reusable wrapper for service descriptions
export function ServiceDescription({ content, className = '' }: { content: string; className?: string }) {
  return (
    <MarkdownRenderer
      content={content}
      className={`service-description ${className}`}
    />
  )
}