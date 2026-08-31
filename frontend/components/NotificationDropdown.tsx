'use client'
import React from 'react'
import { Bell, MessageSquare, X, Check } from 'lucide-react'
import { useNotifications, Notification } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/contexts/UserContext'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, refreshNotifications } = useNotifications()
  const router = useRouter()
  const { currentRole } = useUserContext()

  // Refresh notifications when dropdown opens
  React.useEffect(() => {
    if (isOpen) {
      refreshNotifications()
    }
  }, [isOpen, refreshNotifications])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    markAsRead(notification.id)

    // Navigate to chat
    const chatId = notification.chatId || notification.from
    
    if (currentRole === 'client') {
      router.push(`/client/chat?with=${encodeURIComponent(chatId)}`)
    } else if (currentRole === 'freelancer') {
      router.push(`/freelancer/messages?with=${encodeURIComponent(chatId)}`)
    } else {
      // Fallback to client chat
      router.push(`/client/chat?with=${encodeURIComponent(chatId)}`)
    }

    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[500px] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-gray-600" />
          <h3 className="font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
              title="Mark all as read"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                  !notification.read ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    !notification.read ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <MessageSquare 
                      size={18} 
                      className={!notification.read ? 'text-blue-600' : 'text-gray-600'} 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {notification.from}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearNotification(notification.id)
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 ml-2"
                    title="Remove notification"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-200">
          <button
            onClick={() => {
              router.push(currentRole === 'client' ? '/client/chat' : '/freelancer/messages')
              onClose()
            }}
            className="w-full text-sm text-blue-600 hover:text-blue-700 text-center py-2"
          >
            View all messages
          </button>
        </div>
      )}
    </div>
  )
}

