'use client'
import React, { useState, useEffect } from 'react';
import { Search, MessageSquare } from 'lucide-react';

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
      <div className="flex flex-col h-full items-center justify-center p-8">
        <p className="text-gray-500 text-center">Please log in to view messages</p>
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
      <div className="flex flex-col h-full">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-full mb-4"></div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search your messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-4 pr-12 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-amber-500 rounded-full p-2">
            <Search size={18} className="text-white" />
          </div>
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {chatsToDisplay.length > 0 ? (
          chatsToDisplay.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 ${
              selectedChatId === chat.id ? 'bg-gray-50' : ''
            }`}
          >
            <div className="relative">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {chat.unread > 0 && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {chat.unread}
                </div>
              )}
              {chat.type === 'chat' && (chat as any).profile && (
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-green-500 text-white text-xs rounded-full flex items-center justify-center">
                  👤
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 truncate">
                  {chat.name}
                </h3>
                <span className="text-xs text-gray-500">{chat.time}</span>
              </div>
              <p className="text-sm text-gray-500 truncate">
                {chat.lastMessage}
              </p>
              {chat.type === 'chat' && (chat as any).profile && (chat as any).profile.location && (
                <p className="text-xs text-gray-400 mt-1">
                  📍 {(chat as any).profile.location}
                </p>
              )}
            </div>
          </div>
        ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center p-8">
              <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
              <p className="text-sm text-gray-500 mb-4">Clients will appear here after booking your services</p>
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">💬 How clients find you:</p>
                <ol className="text-left text-xs space-y-1">
                  <li>1. Clients browse your services</li>
                  <li>2. They book your service</li>
                  <li>3. Chat automatically starts</li>
                  <li>4. Discuss project details here</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}