'use client'
import React, { useState, useEffect } from 'react'
import { MessageSquare, AlertCircle } from 'lucide-react'
import { ClientChatsList } from '@/components/client/chat/ClientChatsList'
import { ClientChatConversation } from '@/components/client/chat/ClientChatConversation'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (data.success && data.session?.email) {
          const email = data.session.email
          setUserEmail(email)

          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const withParam = urlParams.get('with')
            if (withParam) setSelectedChatId(withParam)
          }

          fetch('/api/chat/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, displayName: 'Client User' })
          }).catch(error => console.error('Chat auth error (non-critical):', error))
        } else {
          console.warn('[ClientChat] No user session found')
        }
      } catch (error) {
        console.error('Error fetching user session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserSession()
  }, [])

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('with', chatId)
      window.history.replaceState({}, '', url.toString())
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-full w-full gap-4 p-6">
        <Skeleton className="h-full w-1/3" />
        <Skeleton className="hidden h-full flex-1 md:block" />
      </div>
    )
  }

  if (!userEmail) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState icon={AlertCircle} title="Please log in" description="You need to be logged in to view messages." />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface">
      <div className="flex h-full w-full flex-col border-r border-border md:w-1/3">
        <div className="shrink-0 border-b border-border p-6">
          <h1 className="font-heading text-h2 font-semibold text-foreground">Messages</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ClientChatsList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
            userEmail={userEmail}
          />
        </div>
      </div>

      <div className="hidden h-full min-w-0 flex-1 flex-col md:flex">
        {selectedChatId ? (
          <ClientChatConversation chatId={selectedChatId} userEmail={userEmail} />
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={MessageSquare}
              title="Select a conversation"
              description="Choose a conversation from the list to see messages."
            />
          </div>
        )}
      </div>

      {selectedChatId && (
        <div className="absolute inset-0 z-10 flex flex-1 flex-col bg-surface md:hidden">
          <ClientChatConversation chatId={selectedChatId} userEmail={userEmail} />
        </div>
      )}
    </div>
  )
}
