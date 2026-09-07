import React, { useState, useEffect, useCallback, useRef } from 'react'
import socketService, { SocketMessage } from '@/lib/socket-service'
import { MessageInput } from './MessageInput'
import { useToast } from '@/contexts/ToastContext'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

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
      <div className="flex h-full w-full flex-col overflow-hidden bg-card">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <div className="flex-1 space-y-4 p-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
              <div className="max-w-[70%] space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="relative">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(chatId)}&background=9333ea&color=fff`}
            alt={chatId}
            className="size-12 rounded-full object-cover"
          />
          <div className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-success"></div>
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{chatId}</h3>
          <p className="text-sm text-success">Online</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-secondary/40 p-4">
        <div className="space-y-4">
          {finalMessages.map((message, index) => {
            const showDate = index === 0 || message.date !== finalMessages[index - 1]?.date
            return (
              <div key={message.id}>
                {showDate && (
                  <div className="my-4 flex justify-center">
                    <span className="rounded-full bg-card px-3 py-1 text-xs text-muted-foreground shadow-sm">
                      {message.date}
                    </span>
                  </div>
                )}
                <div className={cn('flex', message.sender === 'me' ? 'justify-end' : 'justify-start')}>
                  {message.sender !== 'me' && (
                    <img
                      src={message.senderAvatar}
                      alt={message.senderName}
                      className="mr-2 mt-1 size-8 rounded-full object-cover"
                    />
                  )}
                  <div className="max-w-[70%]">
                    {message.sender !== 'me' && (
                      <p className="mb-1 ml-1 text-xs text-muted-foreground">{message.senderName}</p>
                    )}
                    <div
                      className={cn(
                        'rounded-lg p-3',
                        message.sender === 'me'
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-border bg-card text-foreground',
                      )}
                    >
                      {message.messageType === 'image' && message.fileUrl ? (
                        <div className="space-y-2">
                          <img
                            src={message.fileUrl}
                            alt={message.fileName || 'Image'}
                            className="max-h-64 max-w-full rounded-lg object-contain"
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
                    <div className="mt-1 px-1 text-xs text-muted-foreground">
                      {message.time}
                    </div>
                  </div>
                  {message.sender === 'me' && (
                    <img
                      src={myAvatarUrl}
                      alt="Me"
                      className="ml-2 mt-1 size-8 rounded-full object-cover"
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