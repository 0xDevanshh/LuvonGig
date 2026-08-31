'use client'
import React, { useState, useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import { ClientChatsList } from '../../../components/client/chat/ClientChatsList'
import { ClientChatConversation } from '../../../components/client/chat/ClientChatConversation'
import ClientLayout from '../layout'

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  // Load user email from server session
  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/auth/session')
        const data = await response.json()

        if (data.success && data.session?.email) {
          const email = data.session.email
          setUserEmail(email)
          
          // Check if we should pre-select a chat from URL params
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search)
            const withParam = urlParams.get('with')

            if (withParam) {
              setSelectedChatId(withParam)
              console.log(`[DEBUG] Chat URL param: with=${withParam}, userEmail=${email}`)
            }
          }

          // Authenticate with the canister (non-blocking)
          fetch('/api/chat/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email,
              displayName: 'Client User'
            })
          }).then(res => res.json())
            .then(authData => console.log('Authentication result:', authData))
            .catch(error => console.error('Authentication error:', error))
        } else {
          console.warn('[ClientChat] No user session found')
        }
      } catch (error) {
        console.error('Error fetching user session:', error)
        console.warn('[ClientChat] No user email available for authentication')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserSession()
  }, [])

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId)

    // Update URL with the 'with' parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('with', chatId)
      window.history.replaceState({}, '', url.toString())
    }
  }


  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading messages...</p>
        </div>
      </div>
    )
  }

  if (!userEmail) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Please log in</h3>
          <p className="text-sm text-gray-500 mb-4">You need to be logged in to view messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
      </div>

      {/* Chat Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat List */}
        <div className="w-full md:w-1/3 border-r border-gray-200 flex flex-col">
          <ClientChatsList
            onSelectChat={handleSelectChat}
            selectedChatId={selectedChatId}
            userEmail={userEmail}
          />
        </div>

        {/* Right Panel - Chat Conversation */}
        {selectedChatId && userEmail ? (
          <div className="hidden md:flex flex-1 flex-col">
            <ClientChatConversation chatId={selectedChatId} userEmail={userEmail} />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-500">Choose a chat from the left to start messaging</p>
            </div>
          </div>
        )}

        {/* Mobile - Show conversation when selected */}
        {selectedChatId && userEmail && (
          <div className="md:hidden flex-1 flex flex-col absolute inset-0 bg-white z-10">
            <ClientChatConversation chatId={selectedChatId} userEmail={userEmail} />
          </div>
        )}
      </div>
    </div>
  )
}