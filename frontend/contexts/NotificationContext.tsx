'use client'
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import socketService, { SocketMessage } from '@/lib/socket-service'
import { useUserContext } from './UserContext'

export interface Notification {
  id: string
  message: string
  from: string
  to: string
  timestamp: string
  read: boolean
  chatId?: string
  bookingId?: string
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const { profile } = useUserContext()
  const userEmail = profile?.email

  // Load notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && userEmail) {
      const stored = localStorage.getItem(`notifications_${userEmail}`)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setNotifications(parsed)
        } catch (error) {
          console.error('Error loading notifications from localStorage:', error)
        }
      }
    }
  }, [userEmail])

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && userEmail) {
      localStorage.setItem(`notifications_${userEmail}`, JSON.stringify(notifications))
    }
  }, [notifications, userEmail])

  // Function to fetch unread messages and create notifications
  const fetchUnreadMessages = useCallback(async () => {
    try {
      if (!userEmail) return

      // Fetch recent chats which include unread messages
      const response = await fetch(`/api/chat/recent?userEmail=${encodeURIComponent(userEmail)}&limit=50`)

      if (!response.ok) {
        console.warn('[Notifications] Failed to fetch recent chats:', response.status)
        return
      }

      const data = await response.json()

      if (data.success && data.chats) {
        console.log('[Notifications] Fetched chats:', data.chats.length)

        // Filter for unread messages (messages sent TO the user that are unread)
        const unreadChats = data.chats.filter((chat: any) => {
          const lastMsg = chat.lastMessage
          if (!lastMsg) return false

          // Message is unread if: sent TO user, not FROM user, and not read
          const isUnread = lastMsg.to === userEmail &&
            lastMsg.from !== userEmail &&
            !lastMsg.read

          if (isUnread) {
            console.log('[Notifications] Found unread message from:', lastMsg.from, 'text:', lastMsg.text?.substring(0, 30))
          }

          return isUnread
        })

        console.log('[Notifications] Unread chats found:', unreadChats.length)

        // Create notifications from unread messages
        const newNotifications: Notification[] = unreadChats.map((chat: any) => {
          const lastMsg = chat.lastMessage
          return {
            id: `notif_${lastMsg.id || chat.contact}_${Date.now()}_${Math.random()}`,
            message: lastMsg.text || 'New message',
            from: lastMsg.from || chat.contact,
            to: userEmail,
            timestamp: lastMsg.timestamp || new Date().toISOString(),
            read: false,
            chatId: lastMsg.from || chat.contact,
            bookingId: lastMsg.bookingId
          }
        })

        if (newNotifications.length > 0) {
          setNotifications(prev => {
            // Merge with existing notifications, avoiding duplicates
            const existingIds = new Set(prev.map(n => n.id))
            const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id))

            // Also check for duplicates by from + message + timestamp (within 1 second)
            const existingKeys = new Set(
              prev.map(n => `${n.from}_${n.message}_${Math.floor(new Date(n.timestamp).getTime() / 1000)}`)
            )
            const trulyUnique = uniqueNew.filter(
              n => !existingKeys.has(`${n.from}_${n.message}_${Math.floor(new Date(n.timestamp).getTime() / 1000)}`)
            )

            console.log('[Notifications] Adding', trulyUnique.length, 'new notifications')
            return [...trulyUnique, ...prev].slice(0, 50)
          })
        }
      }
    } catch (error) {
      console.error('[Notifications] Error fetching unread messages:', error)
    }
  }, [userEmail])

  // Listen for new messages via Socket.IO
  useEffect(() => {
    if (!userEmail) return

    const handlePrivateMessage = (message: SocketMessage) => {
      // Only create notification if message is for current user
      if (message.to === userEmail && message.from !== userEmail) {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          message: message.text || 'New message',
          from: message.from,
          to: message.to,
          timestamp: message.timestamp || new Date().toISOString(),
          read: false,
          chatId: message.from, // Use sender email as chatId for navigation
          bookingId: message.bookingId
        }

        setNotifications(prev => {
          // Check if notification already exists (prevent duplicates)
          const exists = prev.some(n =>
            n.from === notification.from &&
            n.message === notification.message &&
            Math.abs(new Date(n.timestamp).getTime() - new Date(notification.timestamp).getTime()) < 1000
          )

          if (exists) return prev

          // Add new notification at the beginning
          return [notification, ...prev].slice(0, 50) // Keep only last 50 notifications
        })
      }
    }

    // Subscribe to socket messages
    socketService.on('privateMessage', handlePrivateMessage)

    // Fetch unread messages on mount
    fetchUnreadMessages()

    return () => {
      socketService.off('privateMessage', handlePrivateMessage)
    }
  }, [userEmail, fetchUnreadMessages])

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    )
  }, [])

  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        refreshNotifications: fetchUnreadMessages
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

