'use client'
import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, MapPin, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

interface Chat {
  contact: string
  lastMessage: {
    id: string
    from: string
    to: string
    text: string
    timestamp: string
    delivered: boolean
    read: boolean
    messageType: string
  }
}

interface BookingContact {
  email: string
  name: string
  serviceTitle: string
  bookingId: string
  status: string
  lastMessage?: {
    text: string
    timestamp: string
  }
  type: 'client' | 'freelancer'
}

interface ChatsListProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId: string | null;
  userEmail: string;
  userType: 'client' | 'freelancer' | 'both';
}
export function ChatsList({
  onSelectChat,
  selectedChatId,
  userEmail,
  userType
}: ChatsListProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [bookingContacts, setBookingContacts] = useState<BookingContact[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Early return if no userEmail - show message instead of loading
  if (!userEmail) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-center text-muted-foreground">Please log in to view messages</p>
      </div>
    )
  }

  // Load recent chats from API
  const loadRecentChats = async () => {
    try {
      if (!userEmail) {
        console.warn('[ChatsList] Cannot load recent chats: no userEmail')
        return
      }

      const response = await fetch(`/api/chat/recent?userEmail=${encodeURIComponent(userEmail)}&limit=20`)
      
      if (!response.ok) {
        throw new Error(`Failed to load recent chats: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log('[ChatsList] Loaded recent chats:', data.chats?.length || 0)
        setChats(data.chats || [])
      } else {
        console.warn('[ChatsList] API returned unsuccessful response:', data.error)
        setChats([])
      }
    } catch (error) {
      console.error('[ChatsList] Error loading recent chats:', error)
      setChats([]) // Set empty array on error to prevent UI issues
    }
  }

  // Load booking contacts
  const loadBookingContacts = async () => {
    try {
      if (!userEmail) {
        console.warn('[ChatsList] Cannot load booking contacts: no userEmail')
        return
      }

      // Import marketplace storage functions
      // One request. This used to fetch bookings, kick off chat-relationship
      // creation, then fetch every counterparty's profile individually and
      // dedupe them in the browser — all of which /api/chat/booking-contacts
      // now does in a single query, scoped to the signed-in user.
      const res = await fetch('/api/chat/booking-contacts')
      const body = await res.json()

      if (!res.ok || !body.success) {
        console.warn('[ChatsList] Could not load booking contacts:', body.error)
        setBookingContacts([])
        return
      }

      const uniqueContacts = (body.data ?? []).map((c: {
        email: string; name: string; booking_id: string; service_title: string;
      }) => ({
        email: c.email,
        name: c.name || c.email.split('@')[0],
        type: 'client' as const,
        profile: null,
        serviceTitle: c.service_title || 'Service',
        bookingId: c.booking_id,
        status: 'Active',
      }))

      console.log('[ChatsList] Created booking contacts:', uniqueContacts.length)
      setBookingContacts(uniqueContacts)
    } catch (error) {
      console.error('[ChatsList] Error loading booking contacts:', error)
      setBookingContacts([]) // Set empty array on error
    }
  }

  // Load both chats and booking contacts
  useEffect(() => {
    if (!userEmail) {
      console.warn('[ChatsList] No userEmail provided, skipping load')
      setLoading(false)
      return
    }

    setLoading(true)
    console.log('[ChatsList] Loading chats for user:', userEmail)
    
    Promise.all([
      loadRecentChats().catch(err => {
        console.error('[ChatsList] Error loading recent chats:', err)
        return [] // Return empty array on error
      }),
      loadBookingContacts().catch(err => {
        console.error('[ChatsList] Error loading booking contacts:', err)
        return [] // Return empty array on error
      })
    ])
      .finally(() => {
        console.log('[ChatsList] Finished loading chats')
        setLoading(false)
      })
  }, [userEmail]) // Removed userType from dependencies to avoid unnecessary reloads

  // Filter chats based on search query (search by contact name/email)
  const filteredChats = chats.filter(chat => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return chat.contact.toLowerCase().includes(query) ||
           chat.lastMessage.text.toLowerCase().includes(query);
  });

  // Filter booking contacts based on search query (search by name, email, or service title)
  const filteredBookingContacts = bookingContacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return contact.email.toLowerCase().includes(query) ||
           contact.name.toLowerCase().includes(query) ||
           (contact.serviceTitle && contact.serviceTitle.toLowerCase().includes(query));
  });

  // Convert chat data to display format
  const displayChats = filteredChats.map(chat => ({
    id: chat.contact,
    name: chat.contact,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.contact)}&background=9333ea&color=fff`,
    lastMessage: chat.lastMessage.text,
    time: new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    unread: chat.lastMessage.from !== userEmail && !chat.lastMessage.read ? 1 : 0,
    type: 'chat' as const
  }))

  // Convert booking contacts to display format (simplified user info only)
  const displayBookingContacts = filteredBookingContacts.map(contact => {
    const clientProfile = (contact as any).profile

    // Use real client profile data if available
    const displayName = clientProfile?.displayName || contact.name
    const avatarUrl = clientProfile?.profileImage && !clientProfile.fallback
      ? clientProfile.profileImage
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=10b981&color=fff`

    return {
      id: contact.email,
      name: displayName,
      avatar: avatarUrl,
      lastMessage: 'Click to start conversation',
      time: '',
      unread: 0,
      type: 'chat' as const,
      profile: clientProfile ? {
        location: clientProfile.location,
        bio: clientProfile.bio
      } : null
    }
  })

  // Combine and deduplicate by email (prioritize chat contacts over booking contacts)
  const allContacts = [...displayChats]
  displayBookingContacts.forEach(bookingContact => {
    const existingChatIndex = allContacts.findIndex(chat => chat.id === bookingContact.id)
    if (existingChatIndex === -1) {
      allContacts.push(bookingContact)
    }
  })

  // Sort by most recent message
  allContacts.sort((a, b) => {
    const timeA = a.time ? new Date(a.time).getTime() : 0
    const timeB = b.time ? new Date(b.time).getTime() : 0
    return timeB - timeA
  })

  const chatsToDisplay = allContacts
  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="p-4">
          <Skeleton className="h-12 rounded-full" />
        </div>
        <div className="flex-1 space-y-4 p-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-12 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search your messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full pl-9"
          />
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {chatsToDisplay.length > 0 ? (
          chatsToDisplay.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={cn(
              'flex cursor-pointer items-center gap-3 p-4 hover:bg-accent',
              selectedChatId === chat.id && 'bg-accent',
            )}
          >
            <div className="relative">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="size-12 rounded-full object-cover"
              />
              {chat.unread > 0 && (
                <div className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
                  {chat.unread}
                </div>
              )}
              {chat.type === 'chat' && (chat as any).profile && (
                <div className="absolute -bottom-1 -left-1 flex size-4 items-center justify-center rounded-full bg-success text-white">
                  <User className="size-2.5" />
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="truncate font-medium text-foreground">
                  {chat.name}
                </h3>
                <span className="text-xs text-muted-foreground">{chat.time}</span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {chat.lastMessage}
              </p>
              {chat.type === 'chat' && (chat as any).profile && (chat as any).profile.location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {(chat as any).profile.location}
                </p>
              )}
            </div>
          </div>
        ))
        ) : (
          <EmptyState
            className="h-full justify-center border-none"
            icon={MessageSquare}
            title="No messages yet"
            description="Clients will appear here after booking your services."
          />
        )}
      </div>
    </div>
  )
}