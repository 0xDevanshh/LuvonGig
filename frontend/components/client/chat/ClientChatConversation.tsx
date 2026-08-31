'use client'
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ClientMessageInput } from './ClientMessageInput'
import socketService, { SocketMessage } from '../../../lib/socket-service'
import { MessageCircle, Wifi, WifiOff } from 'lucide-react'

interface Message {
  id: string
  from: string
  to: string
  text: string
  timestamp: string
  delivered: boolean
  read: boolean
  messageType: string
  fileUrl?: string
  fileName?: string
  fileSize?: number
  replyTo?: string
  bookingId?: string
}

interface ClientChatConversationProps {
  chatId: string
  userEmail: string
  bookingId?: string
}

export function ClientChatConversation({
  chatId,
  userEmail,
  bookingId
}: ClientChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [userProfileImage, setUserProfileImage] = useState<string>('')
  const fetchingRef = useRef(false) // Guard against concurrent fetches
  const isInitialLoadRef = useRef(true) // Track if this is the first load

  // Fetch user's real profile image from canister
  useEffect(() => {
    if (!userEmail) return
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(`/api/user/profile?email=${encodeURIComponent(userEmail)}`)
        const data = await response.json()
        if (data.success && data.data?.profileImage) {
          setUserProfileImage(data.data.profileImage)
        }
      } catch (error) {
        console.error('[ClientChat] Error fetching user profile image:', error)
      }
    }
    fetchUserProfile()
  }, [userEmail])

  // Generate avatar URL for the current user
  const myAvatarUrl = userProfileImage
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail.split('@')[0])}&background=9333ea&color=fff`

  // Load chat history from canister — wrapped in useCallback to avoid stale closures
  const loadChatHistory = useCallback(async () => {
    // Don't load if chatId or userEmail is missing
    if (!chatId || !userEmail) {
      console.log(`[ClientChat] Skipping load - chatId: ${chatId}, userEmail: ${userEmail ? 'present' : 'missing'}`)
      setLoading(false)
      return
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log('[ClientChat] Skipping load - fetch already in progress')
      return
    }
    fetchingRef.current = true

    try {
      if (isInitialLoadRef.current) {
        setLoading(true)
      }
      console.log(`[ClientChat] Loading chat history: ${userEmail} <-> ${chatId}`)

      // Try Socket.IO first for real-time history
      if (socketService.isConnected()) {
        try {
          const socketHistory = await socketService.getChatHistory(chatId, 50, 0)
          if (socketHistory && socketHistory.length > 0) {
            console.log(`[ClientChat] Loaded ${socketHistory.length} messages from Socket.IO`)
            const formattedMessages = socketHistory.map(msg => ({
              id: msg.id,
              from: msg.from,
              to: msg.to,
              text: msg.text,
              timestamp: msg.timestamp,
              delivered: msg.delivered,
              read: msg.read,
              messageType: msg.messageType || 'text',
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              fileSize: msg.fileSize,
              replyTo: msg.replyTo
            }))

            // Sort messages by timestamp (oldest first)
            const sortedMessages = formattedMessages.sort((a, b) => {
              const timestampA = new Date(a.timestamp).getTime()
              const timestampB = new Date(b.timestamp).getTime()
              return timestampA - timestampB
            })

            console.log(`[ClientChat] Socket.IO messages sorted: ${sortedMessages.length} messages`)
            setMessages(sortedMessages)
            setLoading(false)
            isInitialLoadRef.current = false
            return
          }
        } catch (socketError) {
          console.warn('[ClientChat] Socket.IO history load failed, falling back to API:', socketError)
        }
      }

      // Fallback to API if Socket.IO doesn't have history
      console.log(`[ClientChat] Loading chat history from API: ${userEmail} <-> ${chatId}`)
      const response = await fetch(
        `/api/chat/history?userEmail=${encodeURIComponent(userEmail)}&contactEmail=${encodeURIComponent(chatId)}&limit=50&offset=0`
      )

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log(`[ClientChat] Loaded ${data.messages?.length || 0} messages from API`)

        const sortedMessages = (data.messages || []).sort((a: any, b: any) => {
          const timestampA = new Date(a.timestamp).getTime()
          const timestampB = new Date(b.timestamp).getTime()
          return timestampA - timestampB
        })

        setMessages(sortedMessages)
      } else {
        console.warn('[ClientChat] Failed to load chat history from API:', data.error)
        // Only set empty on initial load — never wipe existing messages on refresh error
        if (isInitialLoadRef.current) {
          setMessages([])
        }
      }
    } catch (error) {
      console.error('[ClientChat] Error loading chat history:', error)
      // Only set empty on initial load — keep existing messages on transient errors
      if (isInitialLoadRef.current) {
        setMessages([])
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
      isInitialLoadRef.current = false
    }
  }, [chatId, userEmail])

  // Initialize Socket.IO and load chat history when chatId changes
  useEffect(() => {
    if (!chatId || !userEmail) return

    // Reset initial load flag when chat changes
    isInitialLoadRef.current = true

    // Initialize Socket.IO connection (optional - chat works without it)
    const initializeSocket = async () => {
      try {
        const connected = await socketService.connect(userEmail)
        if (connected && socketService.isConnected()) {
          console.log('[ClientChat] ✅ Socket connected - real-time features enabled')
          socketService.joinRoom(chatId)
        } else {
          console.log('[ClientChat] ℹ️  Socket server not available - using REST API')
        }
      } catch (error) {
        console.debug('[ClientChat] Socket initialization (REST API fallback available):', error)
      }
    }

    initializeSocket()
    loadChatHistory()

    // Cleanup on unmount
    return () => {
      if (socketService.isConnected()) {
        socketService.leaveRoom(chatId)
      }
    }
  }, [chatId, userEmail, loadChatHistory])

  // Setup Socket.IO event listeners
  useEffect(() => {
    if (!chatId || !userEmail) return

    // Listen for connection status changes
    const handleConnectionStatus = (status: any) => {
      setSocketConnected(status.connected)
      setConnectionError(status.error || null)
    }

    // Listen for new private messages
    const handlePrivateMessage = (message: SocketMessage) => {
      // Only add messages that are relevant to this chat
      if ((message.from === chatId && message.to === userEmail) ||
        (message.to === chatId && message.from === userEmail)) {

        const newMessage: Message = {
          id: message.id || `socket-${Date.now()}`,
          from: message.from,
          to: message.to,
          text: message.text,
          timestamp: message.timestamp || new Date().toISOString(),
          delivered: true,
          read: false,
          messageType: message.messageType || 'text'
        }

        setMessages(prev => {
          // Avoid duplicates
          const exists = prev.some(m =>
            m.text === newMessage.text &&
            Math.abs(new Date(m.timestamp).getTime() - new Date(newMessage.timestamp).getTime()) < 1000
          )
          return exists ? prev : [...prev, newMessage]
        })

        // Mark as read if it's a message sent to us
        if (message.to === userEmail) {
          setTimeout(() => {
            markMessageAsRead(newMessage.id)
          }, 1000) // Mark as read after 1 second
        }
      }
    }

    // Listen for typing indicators
    const handleTypingIndicator = (data: { from: string; isTyping: boolean; timestamp: string }) => {
      if (data.from === chatId) {
        console.log(`[ClientChat] ${data.from} is ${data.isTyping ? 'typing...' : 'not typing'}`)
        // You can add a typing indicator UI here
      }
    }

    // Listen for read receipts
    const handleMessageRead = (data: { messageId: string; readBy: string; timestamp: string }) => {
      if (data.readBy === chatId) {
        setMessages(prev => prev.map(msg =>
          msg.id === data.messageId ? { ...msg, read: true } : msg
        ))
      }
    }

    // Listen for online status changes
    const handleUserPresence = (data: { user: string; isOnline: boolean; lastSeen: string }) => {
      if (data.user === chatId) {
        console.log(`[ClientChat] ${data.user} is ${data.isOnline ? 'online' : 'offline'}`)
      }
    }

    // Register event listeners
    socketService.on('connectionStatus', handleConnectionStatus)
    socketService.on('privateMessage', handlePrivateMessage)
    socketService.on('typingIndicator', handleTypingIndicator)
    socketService.on('messageRead', handleMessageRead)
    socketService.on('userPresence', handleUserPresence)

    // Initial connection status
    setSocketConnected(socketService.isConnected())

    // Mark message as read
    const markMessageAsRead = async (messageId: string) => {
      try {
        await socketService.markAsRead(messageId)
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, read: true } : msg
        ))
      } catch (error) {
        console.error('[ClientChat] Failed to mark message as read:', error)
      }
    }

    // Cleanup
    return () => {
      socketService.off('connectionStatus', handleConnectionStatus)
      socketService.off('privateMessage', handlePrivateMessage)
      socketService.off('typingIndicator', handleTypingIndicator)
      socketService.off('messageRead', handleMessageRead)
      socketService.off('userPresence', handleUserPresence)
    }
  }, [chatId, userEmail])


  // Refresh chat history when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && chatId && userEmail) {
        console.log('[ClientChat] Page became visible, refreshing chat history')
        loadChatHistory()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [chatId, userEmail])

  // Periodic refresh of chat history (every 60 seconds, skip if Socket.IO is connected)
  useEffect(() => {
    if (!chatId || !userEmail) return

    const interval = setInterval(() => {
      // Skip polling if Socket.IO is handling real-time messages
      if (socketService.isConnected()) {
        console.log('[ClientChat] Skipping periodic refresh - Socket.IO connected')
        return
      }
      console.log('[ClientChat] Periodic chat history refresh (no socket)')
      loadChatHistory()
    }, 60000) // 60 seconds

    return () => clearInterval(interval)
  }, [chatId, userEmail])

  // Send message via Socket.IO with enhanced features
  const sendMessage = async (text: string, options?: {
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyTo?: string;
  }) => {
    if ((!text || !text.trim()) && !options?.fileUrl || !chatId || !userEmail) {
      throw new Error('Missing required information to send message')
    }

    // Use the chatId directly as the recipient email (from URL params)
    const recipientEmail = chatId
    console.log(`[DEBUG] Sending message: from=${userEmail}, to=${recipientEmail}, text=${text.trim()}`)

    const messageData = {
      to: recipientEmail,
      text: text.trim() || (options?.fileUrl ? '📷 Image' : ''),
      timestamp: new Date().toISOString(),
      messageType: options?.messageType || 'text',
      fileUrl: options?.fileUrl,
      fileName: options?.fileName,
      fileSize: options?.fileSize,
      replyTo: options?.replyTo,
      bookingId: bookingId
    }

    // Try Socket.IO first if connected
    if (socketConnected) {
      try {
        const result = await socketService.sendPrivateMessage(messageData)
        if (result.success) {
          // Add message to local state immediately for better UX
          const optimisticMessage: Message = {
            id: `socket-${Date.now()}`,
            from: userEmail,
            to: recipientEmail,
            text: text.trim() || (options?.fileUrl ? '📷 Image' : ''),
            timestamp: result.timestamp || messageData.timestamp,
            delivered: true,
            read: false,
            messageType: options?.messageType || 'text',
            fileUrl: options?.fileUrl,
            fileName: options?.fileName,
            fileSize: options?.fileSize,
            bookingId: bookingId
          }
          setMessages(prev => {
            const newMessages = [...prev, optimisticMessage]
            // Sort messages by timestamp to maintain order
            return newMessages.sort((a, b) => {
              const timestampA = new Date(a.timestamp).getTime()
              const timestampB = new Date(b.timestamp).getTime()
              return timestampA - timestampB // Oldest first
            })
          })
          return // Success, no need to try storage
        }
        console.warn('[ClientChat] Socket send failed, falling back to storage')
      } catch (error) {
        console.warn('[ClientChat] Socket send error, falling back to storage:', error)
      }
    }

    // Fallback to storage canister
    try {
      const response = await fetch('/api/chat/messages/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: userEmail,
          to: recipientEmail,
          text: text.trim(),
          messageType: options?.messageType || 'text',
          timestamp: messageData.timestamp,
          fileUrl: options?.fileUrl,
          fileName: options?.fileName,
          fileSize: options?.fileSize,
          replyTo: options?.replyTo,
          bookingId: bookingId
        })
      })

      const data = await response.json()
      if (response.ok && data.success) {
        console.log(`[ClientChat] Message saved to canister: ${data.data?.messageId || data.messageId}`)
        const storedMessage: Message = {
          id: data.data?.messageId || data.messageId || `storage-${Date.now()}`,
          from: userEmail,
          to: recipientEmail,
          text: text.trim() || (options?.fileUrl ? '📷 Image' : ''),
          timestamp: messageData.timestamp,
          delivered: true,
          read: false,
          messageType: options?.messageType || 'text',
          fileUrl: options?.fileUrl,
          fileName: options?.fileName,
          fileSize: options?.fileSize,
          bookingId: bookingId
        }
        setMessages(prev => {
          const newMessages = [...prev, storedMessage]
          // Sort messages by timestamp to maintain order
          return newMessages.sort((a, b) => {
            const timestampA = new Date(a.timestamp).getTime()
            const timestampB = new Date(b.timestamp).getTime()
            return timestampA - timestampB // Oldest first
          })
        })
        return // Success
      } else {
        console.error('[ClientChat] Failed to save message to canister:', data.error)
        throw new Error(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('[ClientChat] Failed to send message via storage:', error)
      throw new Error('Failed to send message. Please try again.')
    }
  }

  // Typing indicator function
  const sendTypingIndicator = (isTyping: boolean) => {
    if (socketConnected && chatId) {
      socketService.sendTypingIndicator(chatId, isTyping)
    }
  }

  // Convert messages to display format
  const displayMessages = messages.map(msg => ({
    id: msg.id,
    sender: msg.from === userEmail ? 'me' : 'other',
    senderName: msg.from === userEmail ? 'Me' : msg.from,
    senderAvatar: msg.from === userEmail
      ? myAvatarUrl
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.from)}&background=9333ea&color=fff`,
    text: msg.text,
    messageType: msg.messageType || 'text',
    fileUrl: msg.fileUrl,
    fileName: msg.fileName,
    time: new Date(msg.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    }),
    date: new Date(msg.timestamp).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }))

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="p-4 border-b border-gray-200 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[70%] space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-20 bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Use real messages only - no more mock data
  const finalMessages = displayMessages

  const handleSendMessage = async (message: string, options?: {
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) => {
    await sendMessage(message, options);
  }

  // Get chat info based on chatId
  const getChatInfo = () => {
    if (chatId.includes('@')) {
      // Direct chat with email
      const displayName = chatId.split('@')[0];
      const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);

      return {
        name: formattedName,
        fullName: chatId, // Show full email for clarity
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=9333ea&color=fff`,
        status: 'Online',
        type: 'direct',
        email: chatId // Store email for display
      }
    }

    // Fallback for mock data
    switch (chatId) {
      case '1':
        return {
          name: 'AI Innovation Team',
          avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop',
          status: 'Active',
          type: 'team',
          members: 5
        }
      case '2':
        return {
          name: 'Sarah Chen',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop',
          status: 'Online',
          type: 'direct'
        }
      default:
        return {
          name: chatId,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chatId)}&background=9333ea&color=fff`,
          status: 'Online',
          type: 'direct'
        }
    }
  }

  const chatInfo = getChatInfo()

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-white">
        <div className="relative">
          <img
            src={chatInfo.avatar}
            alt={chatInfo.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          {chatInfo.status === 'Online' && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900">{chatInfo.name}</h3>
            {chatInfo.type === 'direct' && (
              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                Freelancer
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 text-sm">
            <p className="text-green-600">
              {chatInfo.status}
            </p>
            {chatInfo.type === 'team' && (
              <span className="text-gray-600">• {chatInfo.members} members</span>
            )}
            {chatInfo.email && (
              <span className="text-gray-500 text-xs">• {chatInfo.email}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs">
            {socketConnected ? (
              <>
                <Wifi size={12} className="text-green-500" />
                <span className="text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-red-500" />
                <span className="text-red-600">Offline</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="space-y-4">
          {finalMessages.map((message, index) => {
            const showDate = index === 0 || message.date !== finalMessages[index - 1]?.date
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="flex justify-center my-4">
                    <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm">
                      {message.date}
                    </span>
                  </div>
                )}
                <div className={`flex ${message.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                  {message.sender !== 'me' && (
                    <img
                      src={message.senderAvatar}
                      alt={message.senderName}
                      className="w-8 h-8 rounded-full object-cover mr-2 mt-1"
                    />
                  )}
                  <div className="max-w-[70%]">
                    {message.sender !== 'me' && (
                      <p className="text-xs text-gray-600 mb-1 ml-1">{message.senderName}</p>
                    )}
                    <div
                      className={`p-3 rounded-lg ${message.sender === 'me'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                    >
                      {message.messageType === 'image' && message.fileUrl ? (
                        <div className="space-y-2">
                          <img
                            src={message.fileUrl}
                            alt={message.fileName || 'Image'}
                            className="max-w-full max-h-64 rounded-lg object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Not+Found';
                            }}
                          />
                          {message.text && message.text !== '📷 Image' && (
                            <p className="text-sm">{message.text}</p>
                          )}
                        </div>
                      ) : (
                        <p>{message.text}</p>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1 px-1">
                      {message.time}
                    </div>
                  </div>
                  {message.sender === 'me' && (
                    <img
                      src={myAvatarUrl}
                      alt="Me"
                      className="w-8 h-8 rounded-full object-cover ml-2 mt-1"
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Message Input */}
      <ClientMessageInput onSendMessage={handleSendMessage} />
    </div>
  )
}