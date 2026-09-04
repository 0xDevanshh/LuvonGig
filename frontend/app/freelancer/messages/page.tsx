'use client'
import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import { ChatsList } from '@/components/messages/ChatsList';
import { ChatConversation } from '@/components/messages/ChatConversation';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userType, setUserType] = useState<'client' | 'freelancer' | 'both'>('freelancer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const sessionResponse = await fetch('/api/auth/session')
          const sessionData = await sessionResponse.json()

          if (sessionData.success && sessionData.session?.email) {
            const email = sessionData.session.email
            setUserEmail(email)
            setUserType('freelancer')

            if (typeof window !== 'undefined') {
              const urlParams = new URLSearchParams(window.location.search)
              const withParam = urlParams.get('with')
              if (withParam) setSelectedChatId(withParam)
            }

            try {
              await fetch('/api/chat/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName: 'Freelancer' })
              })
            } catch (authError) {
              console.warn('[Messages] Chat auth error (non-critical):', authError)
            }

            setLoading(false);
            return;
          }

          const meResponse = await fetch('/api/auth/me')
          const meData = await meResponse.json()

          if (meData.success && meData.session?.email) {
            const email = meData.session.email
            setUserEmail(email)
            setUserType('freelancer')

            try {
              await fetch('/api/chat/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, displayName: 'Freelancer' })
              })
            } catch (authError) {
              console.warn('[Messages] Chat auth error (non-critical):', authError)
            }

            setLoading(false);
            return;
          }
        } catch (sessionError) {
          console.warn('[Messages] Session check failed:', sessionError)
        }

        if (typeof window !== 'undefined') {
          const localEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail')
          if (localEmail) {
            setUserEmail(localEmail)
            setUserType('freelancer')
            setLoading(false);
            return;
          }
        }

        setError('Please log in to view messages')
        setLoading(false);
      } catch (error) {
        console.error('[Messages] Error loading user info:', error)
        setError('Failed to load user information')
        setLoading(false);
      }
    }

    getUserInfo()
  }, [])

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  if (loading) {
    return (
      <div className="flex h-full w-full gap-4 p-6">
        <Skeleton className="h-full w-1/3" />
        <Skeleton className="hidden h-full flex-1 md:block" />
      </div>
    );
  }

  if (error || !userEmail) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load messages"
          description={error || 'Please log in to view messages'}
          action={<Button onClick={() => window.location.reload()}>Retry</Button>}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface">
      <div className="flex h-full w-full flex-col border-r border-border md:w-1/3">
        <div className="shrink-0 border-b border-border p-6">
          <h1 className="font-heading text-h2 font-semibold text-foreground">Messages</h1>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatsList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
            userEmail={userEmail}
            userType={userType}
          />
        </div>
      </div>
      <div className="hidden h-full min-w-0 flex-1 flex-col md:flex">
        {selectedChatId ? (
          <ChatConversation chatId={selectedChatId} userEmail={userEmail} userType={userType} />
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
    </div>
  );
}
