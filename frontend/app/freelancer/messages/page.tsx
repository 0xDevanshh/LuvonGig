'use client'
import React, { useState, useEffect } from 'react';
import { ChatsList } from '@/components/messages/ChatsList';
import { ChatConversation } from '@/components/messages/ChatConversation';

export default function MessagesPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [userType, setUserType] = useState<'client' | 'freelancer' | 'both'>('freelancer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user information from session/storage
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get user session (same method as other pages)
        try {
          // First try /api/auth/session (same as my-services page)
          const sessionResponse = await fetch('/api/auth/session')
          const sessionData = await sessionResponse.json()
          
          console.log('[Messages] Session response:', sessionData)

          if (sessionData.success && sessionData.session?.email) {
            const email = sessionData.session.email
            setUserEmail(email)
            setUserType('freelancer') // Default to freelancer for this page
            
            // Check if we should pre-select a chat from URL params
            if (typeof window !== 'undefined') {
              const urlParams = new URLSearchParams(window.location.search)
              const withParam = urlParams.get('with')
              if (withParam) {
                setSelectedChatId(withParam)
                console.log(`[Messages] Chat URL param: with=${withParam}, userEmail=${email}`)
              }
            }
            
            // Authenticate with the canister
            try {
              const authResponse = await fetch('/api/chat/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: email,
                  displayName: 'Freelancer'
                })
              })
              const authData = await authResponse.json()
              console.log('[Messages] Authentication result:', authData)
            } catch (authError) {
              console.warn('[Messages] Authentication error (non-critical):', authError)
            }

            setLoading(false);
            return;
          }

          // Fallback to /api/auth/me
          console.log('[Messages] Session failed, trying /api/auth/me...')
          const meResponse = await fetch('/api/auth/me')
          const meData = await meResponse.json()
          
          console.log('[Messages] Me response:', meData)

          if (meData.success && meData.session?.email) {
            const email = meData.session.email
            setUserEmail(email)
            setUserType('freelancer')
            
            // Authenticate with the canister
            try {
              const authResponse = await fetch('/api/chat/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: email,
                  displayName: 'Freelancer'
                })
              })
              const authData = await authResponse.json()
              console.log('[Messages] Authentication result:', authData)
            } catch (authError) {
              console.warn('[Messages] Authentication error (non-critical):', authError)
            }

            setLoading(false);
            return;
          }
        } catch (sessionError) {
          console.warn('[Messages] Session check failed:', sessionError)
        }

        // Fallback: Check localStorage/sessionStorage
        if (typeof window !== 'undefined') {
          const localEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail')
          if (localEmail) {
            console.log('[Messages] Using fallback email from storage:', localEmail)
            setUserEmail(localEmail)
            setUserType('freelancer')
            setLoading(false);
            return;
          }
        }

        // No user found
        console.warn('[Messages] No user email found in session or storage')
        setError('Please log in to view messages')
        setLoading(false);
      } catch (error) {
        console.error('[Messages] Error loading user info:', error)
        setError('Failed to load user information')
        setLoading(false);
      }
    }

    getUserInfo()
  }, []) // Only run once on mount

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !userEmail) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load messages</h3>
          <p className="text-sm text-gray-500 mb-4">{error || 'Please log in to view messages'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-white">
      {/* Left Panel */}
      <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col h-full">
        <div className="p-6 flex-shrink-0">
          <h1 className="text-2xl font-bold">Messages</h1>
        </div>
        {/* Chats List */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {userEmail && (
            <ChatsList
              onSelectChat={handleSelectChat}
              selectedChatId={selectedChatId}
              userEmail={userEmail}
              userType={userType}
            />
          )}
        </div>
      </div>
      {/* Right Panel - Chat Conversation */}
      {selectedChatId && userEmail && (
        <div className="hidden md:flex flex-1 flex-col h-full min-w-0">
          <ChatConversation
            chatId={selectedChatId}
            userEmail={userEmail}
            userType={userType}
          />
        </div>
      )}
    </div>
  );
}