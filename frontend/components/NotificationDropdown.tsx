'use client'
import React from 'react'
import { Bell, MessageSquare, X, Check } from 'lucide-react'
import { useNotifications, Notification } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useUserContext } from '@/contexts/UserContext'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
    <div className="absolute right-0 top-full z-50 mt-2 flex max-h-[500px] w-96 flex-col rounded-lg border border-border bg-card shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="rounded-full px-2 py-0.5 text-xs">
              {unreadCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover"
              title="Mark all as read"
            >
              <Check size={14} />
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close notifications"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Bell size={48} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleNotificationClick(notification)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleNotificationClick(notification)
                  }
                }}
                className={cn(
                  'cursor-pointer px-4 py-3 transition-colors hover:bg-accent',
                  !notification.read && 'bg-primary-soft',
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    !notification.read ? 'bg-primary-soft' : 'bg-secondary',
                  )}>
                    <MessageSquare
                      size={18}
                      className={!notification.read ? 'text-primary' : 'text-muted-foreground'}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {notification.from}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="mt-1 size-2 shrink-0 rounded-full bg-primary"></div>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatTime(notification.timestamp)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      clearNotification(notification.id)
                    }}
                    className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                    title="Remove notification"
                    aria-label="Remove notification"
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
        <div className="border-t border-border px-4 py-2">
          <button
            onClick={() => {
              router.push(currentRole === 'client' ? '/client/chat' : '/freelancer/messages')
              onClose()
            }}
            className="w-full py-2 text-center text-sm text-primary hover:text-primary-hover"
          >
            View all messages
          </button>
        </div>
      )}
    </div>
  )
}

