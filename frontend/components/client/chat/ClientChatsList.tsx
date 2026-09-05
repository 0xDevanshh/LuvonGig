'use client'
import React, { useState, useEffect } from 'react'
import { Search, MessageSquare, Briefcase, Calendar, DollarSign, Activity } from 'lucide-react'
import { getUserProfileByEmail, UserProfile } from '../../../lib/user-profile'
import { formatMoney } from '@/lib/currency'

interface BookingChat {
  booking_id: string
  client_email: string
  freelancer_email: string
  service_title: string
  service_id: string
  package_id: string
  status: string
  created_at: string
  updated_at: string
  package_name: string
  price: string
  description: string
  contactEmail: string
  freelancerProfile?: UserProfile
  lastMessage?: {
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

interface ClientChatsListProps {
  onSelectChat: (chatId: string) => void
  selectedChatId: string | null
  userEmail: string
}

export function ClientChatsList({
  onSelectChat,
  selectedChatId,
  userEmail
}: ClientChatsListProps) {
  const [bookingChats, setBookingChats] = useState<BookingChat[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Load chat history for each chat to get last messages
  const loadChatHistoryForChats = async (chats: BookingChat[]) => {
    console.log('[ClientChatsList] Loading chat history for', chats.length, 'chats')
    
    for (const chat of chats) {
      try {
        // Load the most recent message for this chat
        const response = await fetch(
          `/api/chat/history?userEmail=${encodeURIComponent(userEmail)}&contactEmail=${encodeURIComponent(chat.freelancer_email)}&limit=1&offset=0`
        )
        
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.messages && data.messages.length > 0) {
            const lastMessage = data.messages[0]
            console.log(`[ClientChatsList] Loaded last message for ${chat.freelancer_email}:`, lastMessage)
            
            // Update the chat with the last message
            setBookingChats(prevChats => 
              prevChats.map(prevChat => 
                prevChat.freelancer_email === chat.freelancer_email 
                  ? { ...prevChat, lastMessage }
                  : prevChat
              )
            )
          } else {
            console.log(`[ClientChatsList] No messages found for ${chat.freelancer_email}`)
          }
        } else {
          console.warn(`[ClientChatsList] Failed to load chat history for ${chat.freelancer_email}`)
        }
      } catch (error) {
        console.error(`[ClientChatsList] Error loading chat history for ${chat.freelancer_email}:`, error)
      }
    }
  }

  // Load all freelancers whose services have been booked
  useEffect(() => {
    const loadBookedFreelancers = async () => {
      try {
        setLoading(true)
        console.log('Loading booked freelancers for user:', userEmail)

        // Get all client bookings to find freelancers
        const apiUrl = `/api/marketplace/bookings?user_id=${encodeURIComponent(userEmail)}&user_type=client`
        console.log('Calling API:', apiUrl)
        const response = await fetch(apiUrl)
        console.log('API Response status:', response.status)
        console.log('API Response ok:', response.ok)
        
        if (response.ok) {
          const data = await response.json()
          console.log('API Response data:', data)

          // Handle the API response format: data.data contains the bookings array
          let bookings = []
          if (data.success && Array.isArray(data.data)) {
            bookings = data.data
            console.log('Loaded bookings from marketplace API:', bookings)
          }
          
          if (bookings.length > 0) {
            console.log('Loaded client bookings:', bookings)
            console.log('Number of bookings found:', bookings.length)

            // Transform bookings into chat format
            const transformedChats: BookingChat[] = bookings.map((booking: any) => {
              // Get freelancer email from booking - this should be the actual freelancer email
              const freelancerEmail = booking.freelancer_id

              // Skip if freelancer email is missing or is a placeholder
              if (!freelancerEmail || freelancerEmail.includes('@example.com')) {
                console.log('Skipping booking with placeholder freelancer email:', booking.booking_id)
                return null
              }

              // Handle status - it's already a string in the API response
              const status = booking.status || 'Active'

              console.log(`[DEBUG] Chat mapping: userEmail=${userEmail}, freelancerEmail=${freelancerEmail}, booking=${booking.booking_id}`)

              return {
                booking_id: booking.booking_id,
                client_email: booking.client_id, // Use the client_id from the booking
                freelancer_email: freelancerEmail,
                service_title: booking.service_title || 'Service',
                service_id: booking.service_id,
                package_id: booking.package_id,
                status: status,
                created_at: booking.created_at,
                updated_at: booking.updated_at,
                package_name: booking.package_title || booking.package_tier || 'Package',
                price: booking.total_amount_dollars ? `$${booking.total_amount_dollars}` : '0 USD',
                description: booking.client_notes || booking.special_instructions || '',
                contactEmail: freelancerEmail,
                // Set up empty lastMessage for now
                lastMessage: undefined
              };
            }).filter(Boolean) // Remove null entries

            // Remove duplicates based on freelancer email
            const uniqueChats = transformedChats.reduce((acc: BookingChat[], current) => {
              const existingIndex = acc.findIndex(chat => chat.freelancer_email === current.freelancer_email)
              if (existingIndex === -1) {
                acc.push(current)
              } else {
                // Keep the most recent booking for this freelancer
                if (new Date(current.updated_at) > new Date(acc[existingIndex].updated_at)) {
                  acc[existingIndex] = current
                }
              }
              return acc
            }, [])

            // Create chat relationships for new bookings
            for (const chat of uniqueChats) {
              try {
                await fetch('/api/chat/relationships', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bookingId: chat.booking_id,
                    clientEmail: userEmail,
                    freelancerEmail: chat.freelancer_email
                  })
                })
              } catch (error) {
                console.warn('Failed to create chat relationship for booking:', chat.booking_id, error)
              }
            }

            setBookingChats(uniqueChats)
            console.log('Final unique chat list:', uniqueChats)
            
            // Load chat history for each chat to get last messages
            loadChatHistoryForChats(uniqueChats)
          } else {
            console.log('No bookings found in API response')
            console.log('API Response structure:', {
              success: data.success,
              hasData: !!data.data,
              isDataArray: Array.isArray(data.data),
              dataType: typeof data.data,
              dataKeys: data.data ? Object.keys(data.data) : 'no data object',
              dataLength: Array.isArray(data.data) ? data.data.length : 'not array'
            })
            setBookingChats([])
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Failed to call bookings API:', errorData.error || 'Unknown error')
          console.log('Error response:', errorData)
          
          // Try fallback to chat relationships API
          console.log('Trying fallback to chat relationships API...')
          try {
            const fallbackResponse = await fetch('/api/chat/relationships')
            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json()
              if (fallbackData.success && fallbackData.data && fallbackData.data.relationships) {
                console.log('Fallback successful, using chat relationships:', fallbackData.data.relationships)
                // Transform relationships into chat format (similar to original logic)
                const transformedChats: BookingChat[] = fallbackData.data.relationships.map((relationship: any) => {
                  let status = 'Active';
                  if (relationship.status) {
                    if (typeof relationship.status === 'string') {
                      status = relationship.status;
                    } else if (typeof relationship.status === 'object') {
                      const statusKey = Object.keys(relationship.status)[0];
                      status = statusKey || 'Active';
                    }
                  }

                  return {
                    booking_id: relationship.chatId,
                    client_email: relationship.userRole === 'client' ? userEmail : relationship.partnerEmail,
                    freelancer_email: relationship.userRole === 'client' ? relationship.partnerEmail : userEmail,
                    service_title: relationship.serviceTitle,
                    service_id: relationship.serviceId,
                    package_id: relationship.packageId,
                    status: status,
                    created_at: relationship.createdAt,
                    updated_at: relationship.updatedAt,
                    package_name: 'Package',
                    price: relationship.totalAmount ? formatMoney(relationship.totalAmount) : formatMoney(0),
                    description: relationship.description,
                    contactEmail: relationship.partnerEmail,
                    lastMessage: undefined
                  };
                })
                setBookingChats(transformedChats)
                return
              }
            }
          } catch (fallbackError) {
            console.error('Fallback also failed:', fallbackError)
          }
        }
      } catch (error) {
        console.error('Error loading booked freelancers:', error)
        // Set empty array as fallback
        setBookingChats([])
      } finally {
        setLoading(false)
      }
    }

    if (userEmail) {
      console.log('User email available, loading booked freelancers:', userEmail)
      loadBookedFreelancers()
    } else {
      console.log('No user email available, skipping load')
    }
  }, [userEmail, refreshTrigger])

  // Function to refresh the chat list
  const refreshChats = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Auto-refresh chat history when component mounts or user changes
  useEffect(() => {
    if (userEmail && bookingChats.length > 0) {
      console.log('[ClientChatsList] Auto-refreshing chat history for', bookingChats.length, 'chats')
      // Use a timeout to debounce and avoid race conditions
      const timeoutId = setTimeout(() => {
        loadChatHistoryForChats(bookingChats)
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [userEmail, bookingChats.length])

  // Filter chats based on search query
  const filteredChats = bookingChats.filter(chat => {
    const contactEmail = chat.contactEmail || '';
    const serviceTitle = chat.service_title || '';
    const packageName = chat.package_name || '';
    const lastMessageText = chat.lastMessage?.text || '';

    return contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
           serviceTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
           packageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           lastMessageText.toLowerCase().includes(searchQuery.toLowerCase());
  })

  // Convert booking chat data to display format
  const displayChats = filteredChats.map(chat => {
    const freelancerProfile = chat.freelancerProfile

    // Display freelancer email
    const displayName = chat.contactEmail

    const lastMessageText = chat.lastMessage ? chat.lastMessage.text : `Start conversation about ${chat.service_title}`
    const lastMessageTime = chat.lastMessage
      ? new Date(chat.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : new Date(chat.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    const unread = chat.lastMessage && chat.lastMessage.from !== userEmail && !chat.lastMessage.read ? 1 : 0

    // Use profile image if available, otherwise generate avatar
    const avatarUrl = freelancerProfile?.profileImage && !freelancerProfile.fallback
      ? freelancerProfile.profileImage
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.contactEmail.split('@')[0])}&background=9333ea&color=fff`

    return {
      id: chat.contactEmail,
      name: displayName,
      avatar: avatarUrl,
      lastMessage: lastMessageText,
      time: lastMessageTime,
      unread: unread,
      type: 'service' as const,
      service: {
        title: chat.service_title,
        package: chat.package_name,
        price: chat.price,
        status: chat.status,
        bookingId: chat.booking_id
      },
      // Additional profile info for display
      profile: {
        bio: freelancerProfile?.bio || '',
        location: freelancerProfile?.location || '',
        skills: freelancerProfile?.skills || [],
        isOnline: freelancerProfile?.isOnline || false
      }
    }
  })

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

  // Debug information (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('ClientChatsList Debug Info:', {
      userEmail,
      bookingChatsCount: bookingChats.length,
      filteredChatsCount: filteredChats.length,
      displayChatsCount: displayChats.length,
      loading
    })
  }

  // Display only real chats - no more mock data
  const chatsToDisplay = displayChats

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search chats and teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-4 pr-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-purple-600 rounded-full p-2">
              <Search size={18} className="text-white" />
            </div>
          </div>
          <button
            onClick={refreshChats}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            title="Refresh chats"
          >
            <Activity size={18} className="text-gray-600" />
          </button>
        </div>
      </div>

      {/* Chats List */}
      <div className="flex-1 overflow-y-auto">
        {chatsToDisplay.length > 0 ? (
          chatsToDisplay.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
              selectedChatId === chat.id ? 'bg-purple-50 border-l-4 border-purple-600' : ''
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
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-900 truncate">
                  {chat.name}
                </h3>
                <span className="text-xs text-gray-500">{chat.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  chat.type === 'service' ? 'bg-purple-100 text-purple-700' :
                  chat.type === 'team' ? 'bg-blue-100 text-blue-700' :
                  chat.type === 'support' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {chat.type}
                </span>
                <p className="text-sm text-gray-500 truncate">
                  {chat.lastMessage}
                </p>
              </div>
              {chat.service && (
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <Briefcase size={12} />
                  <span className="truncate">{chat.service.title}</span>
                  <span>•</span>
                  <span className="text-purple-600 font-medium">{chat.service.price}</span>
                </div>
              )}
              {chat.profile && (chat.profile.location || chat.profile.skills.length > 0) && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                  {chat.profile.location && (
                    <>
                      <span>📍 {chat.profile.location}</span>
                      {chat.profile.skills.length > 0 && <span>•</span>}
                    </>
                  )}
                  {chat.profile.skills.length > 0 && (
                    <span className="truncate">
                      💼 {chat.profile.skills.slice(0, 3).join(', ')}
                      {chat.profile.skills.length > 3 && '...'}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center p-8">
              <Briefcase size={48} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No booked services yet</h3>
              <p className="text-sm text-gray-500 mb-4">Book services to start chatting with freelancers</p>
              <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-700">
                <p className="font-medium mb-1">💡 How to start chatting:</p>
                <ol className="text-left text-xs space-y-1">
                  <li>1. Browse available services</li>
                  <li>2. Book a service that fits your needs</li>
                  <li>3. Chat automatically appears with the freelancer</li>
                  <li>4. Discuss project details and requirements</li>
                </ol>
              </div>
              <div className="mt-4">
                <a
                  href="/client/browse-services"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Browse Services
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}