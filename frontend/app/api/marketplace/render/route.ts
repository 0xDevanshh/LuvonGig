import { NextRequest, NextResponse } from 'next/server'
import MarkdownIt from 'markdown-it'

// Initialize markdown-it with security options
const md = new MarkdownIt({
  html: false, // Disable HTML for security
  linkify: true,
  typographer: true,
  breaks: true
})

export async function POST(request: NextRequest) {
  try {
    const { content, format = 'markdown' } = await request.json()

    if (!content || typeof content !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Content is required and must be a string'
      }, { status: 400 })
    }

    let renderedContent = content

    if (format === 'markdown') {
      // Render markdown to HTML with security precautions
      renderedContent = md.render(content)

      // Basic HTML sanitization - remove script tags and dangerous attributes
      renderedContent = renderedContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
        .replace(/javascript:/gi, '') // Remove javascript: URLs
    }

    return NextResponse.json({
      success: true,
      data: {
        original: content,
        rendered: renderedContent,
        format: format
      }
    })

  } catch (error) {
    console.error('Error rendering content:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

// GET endpoint for testing
export async function GET() {
  try {
    const testMarkdown = `# Sample Service Description

This is a **bold** text and this is *italic*.

## Features
- Feature 1
- Feature 2
- Feature 3

### Pricing
Basic package starts at **$100**

> **Note:** This is a sample description

\`\`\`javascript
// Example code
function hello() {
  console.log("Hello World!");
}
\`\`\`

[Contact us](mailto:test@example.com) for more info.`

    const rendered = md.render(testMarkdown)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Markdown rendering service is working',
        sample: {
          original: testMarkdown,
          rendered: rendered
        }
      }
    })

  } catch (error) {
    console.error('Error in render test:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Service unavailable'
    }, { status: 500 })
  }
}