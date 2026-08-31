import React, { useState, useEffect, useCallback, useRef } from 'react'
import socketService, { SocketMessage } from '@/lib/socket-service'
import { MessageCircle, Wifi, WifiOff } from 'lucide-react'
import { MessageInput } from './MessageInput'
import { useToast } from '@/contexts/ToastContext'

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

interface ChatConversationProps {
  chatId: string
  userEmail: string
  userType: 'client' | 'freelancer' | 'both'
  bookingId?: string
}
export function ChatConversation({
  chatId,
  userEmail,
  userType,
  bookingId
}: ChatConversationProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [socketConnected, setSocketConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [userProfileImage, setUserProfileImage] = useState<string>('')
  const fetchingRef = useRef(false)
  const isInitialLoadRef = useRef(true)
  const { showToast } = useToast()

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
        console.error('[FreelancerChat] Error fetching user profile image:', error)
      }
    }
    fetchUserProfile()
  }, [userEmail])

  // Generate avatar URL for the current user
  const myAvatarUrl = userProfileImage
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(userEmail.split('@')[0])}&background=9333ea&color=fff`

  // Load chat history from canister — wrapped in useCallback to avoid stale closures
  const loadChatHistory = useCallback(async () => {
    if (!chatId || !userEmail) {
      setLoading(false)
      return
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log('[FreelancerChat] Skipping load - fetch already in progress')
      return
    }
    fetchingRef.current = true

    try {
      if (isInitialLoadRef.current) {
        setLoading(true)
      }

      // Try Socket.IO first for real-time history
      if (socketService.isConnected()) {
        try {
          const socketHistory = await socketService.getChatHistory(chatId, 50, 0)
          if (socketHistory && socketHistory.length > 0) {
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
            setMessages(formattedMessages)
            setLoading(false)
            isInitialLoadRef.current = false
            return
          }
        } catch (socketError) {
          console.warn('[FreelancerChat] Socket.IO history failed, falling back to API:', socketError)
        }
      }

      // Fallback to API
      const response = await fetch(
        `/api/chat/history?userEmail=${encodeURIComponent(userEmail)}&contactEmail=${encodeURIComponent(chatId)}&limit=50&offset=0`
      )
      const data = await response.json()

      if (data.success) {
        setMessages(data.messages || [])
      } else {
        // Only wipe on initial load — keep existing messages on refresh errors
        if (isInitialLoadRef.current) {
          setMessages([])
        }
      }
    } catch (error) {
      console.error('[FreelancerChat] Error loading chat history:', error)
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

    const initializeSocket = async () => {
      try {
        const connected = await socketService.connect(userEmail)
        if (connected && socketService.isConnected()) {
          console.log('[FreelancerChat] ✅ Socket connected')
          socketService.joinRoom(chatId)
        } else {
          console.log('[FreelancerChat] ℹ️  Using REST API fallback')
        }
      } catch (error) {
        console.debug('[FreelancerChat] Socket initialization:', error)
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
        setIsTyping(data.isTyping)
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

    // Register event listeners
    socketService.on('connectionStatus', handleConnectionStatus)
    socketService.on('privateMessage', handlePrivateMessage)
    socketService.on('typingIndicator', handleTypingIndicator)
    socketService.on('messageRead', handleMessageRead)

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
        console.error('[FreelancerChat] Failed to mark message as read:', error)
      }
    }

    // Cleanup
    return () => {
      socketService.off('connectionStatus', handleConnectionStatus)
      socketService.off('privateMessage', handlePrivateMessage)
      socketService.off('typingIndicator', handleTypingIndicator)
      socketService.off('messageRead', handleMessageRead)
    }
  }, [chatId, userEmail])

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

  // Use real messages only — no mock data
  const finalMessages = displayMessages
  // Send message via Socket.IO with enhanced features
  const sendMessage = async (text: string, options?: {
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyTo?: string;
  }) => {
    if (!text.trim() && !options?.fileUrl || !chatId || !userEmail) {
      throw new Error('Missing required information to send message')
    }

    const messageData = {
      to: chatId,
      text: text.trim(),
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
            to: chatId,
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
          setMessages(prev => [...prev, optimisticMessage])
          return // Success, no need to try storage
        }
        console.warn('[FreelancerChat] Socket send failed, falling back to storage')
      } catch (error) {
        console.warn('[FreelancerChat] Socket send error, falling back to storage:', error)
      }
    }

    // Fallback to storage canister
    try {
      const response = await fetch('/api/chat/messages/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: userEmail,
          to: chatId,
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
        const storedMessage: Message = {
          id: data.data?.messageId || data.messageId || `storage-${Date.now()}`,
          from: userEmail,
          to: chatId,
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
        setMessages(prev => [...prev, storedMessage])
        return // Success
      } else {
        throw new Error(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('[FreelancerChat] Failed to send message via storage:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message. Please try again.';
      throw new Error(errorMessage)
    }
  }

  // Typing indicator function
  const sendTypingIndicator = (isTyping: boolean) => {
    if (socketConnected && chatId) {
      socketService.sendTypingIndicator(chatId, isTyping)
    }
  }

  const handleSendMessage = async (message: string, options?: {
    messageType?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
  }) => {
    try {
      await sendMessage(message, options)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Daily message limit reached')) {
        showToast("Daily message limit reached (5 per day)! It will reset every 24 hours, or you can buy the Premium plan for unlimited messages.", "warning", 8000);
      } else {
        showToast(errorMessage, "error");
      }
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full bg-white overflow-hidden">
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
  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-3">
        <div className="relative">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chatId)}&background=9333ea&color=fff`}
            alt={chatId}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{chatId}</h3>
          <p className="text-sm text-green-600">Online</p>
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
                        ? 'bg-blue-600 text-white'
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
      <MessageInput onSendMessage={handleSendMessage} onTypingIndicator={sendTypingIndicator} />
    </div>
  )
}