'use client'

import type { Socket } from 'socket.io-client'

// Socket.IO configuration
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000'

// Lazy load socket.io-client to avoid server-side import issues
let io: any = null
if (typeof window !== 'undefined') {
  import('socket.io-client').then((module) => {
    io = module.io
  })
}

export interface ChatMessage {
  id: string
  from: string
  to: string
  text: string
  timestamp: string
  delivered: boolean
  read: boolean
  messageType: string
  bookingId?: string
}

export interface SocketMessage {
  id?: string
  text: string
  timestamp?: string
  to: string
  from: string
  messageType?: string
  bookingId?: string
}

export interface OnlineUser {
  username: string
  lastSeen?: number
}

export interface ConnectionStatus {
  connected: boolean
  error?: string
  reconnecting?: boolean
}

class SocketService {
  private socket: Socket | null = null
  private userEmail: string = ''
  private listeners: Map<string, Function[]> = new Map()
  private connectionStatus: ConnectionStatus = { connected: false }
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private isConnecting = false

  // Initialize socket connection
  connect(userEmail: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      this.userEmail = userEmail

      // Don't reconnect if already connected
      if (this.socket?.connected) {
        console.log(`[Socket] Already connected as ${userEmail}`)
        resolve(true)
        return
      }

      // Prevent multiple connection attempts
      if (this.isConnecting) {
        console.log(`[Socket] Connection already in progress for ${userEmail}`)
        resolve(false)
        return
      }

      this.isConnecting = true

      // Disconnect existing socket if any
      if (this.socket) {
        console.log(`[Socket] Disconnecting existing socket before reconnecting`)
        this.socket.disconnect()
        this.socket = null
      }

      try {
        // Ensure io is loaded
        if (!io && typeof window !== 'undefined') {
          const module = await import('socket.io-client')
          io = module.io
        }

        if (!io) {
          throw new Error('Socket.io client not available')
        }

        console.log(`[Socket] Creating new connection for ${userEmail}`)
        this.socket = io(SOCKET_URL, {
          // Identity comes from the httpOnly `sid` session cookie, verified
          // server-side on the handshake. The previous version sent
          // `auth: { username: userEmail }` and the server believed it — any
          // client could connect as any user and read their messages.
          //
          // withCredentials is what makes the browser attach the cookie to a
          // cross-origin socket handshake at all.
          withCredentials: true,
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true
        })

        if (!this.socket) {
          throw new Error('Failed to create socket')
        }

        this.setupEventListeners()

        this.socket.on('connect', () => {
          console.log(`[Socket] ✅ Connected as ${userEmail}`)
          this.connectionStatus = { connected: true }
          this.reconnectAttempts = 0
          this.isConnecting = false
          this.emit('connectionStatus', this.connectionStatus)
          resolve(true)
        })

        // Suppress websocket errors in console - they're expected when server isn't running
        this.socket.on('error', (error: any) => {
          // Only log as warning, not error, since REST API fallback is available
          console.debug('[Socket] WebSocket error (REST API fallback available):', error?.message || error)
        })

        this.socket.on('connect_error', (error) => {
          console.warn('[Socket] Connection error (will use REST API fallback):', error.message)
          // Don't treat connection errors as fatal - chat will work via REST API
          this.connectionStatus = { connected: false, error: 'WebSocket unavailable, using REST API' }
          this.isConnecting = false
          this.emit('connectionStatus', this.connectionStatus)
          // Still resolve as true since REST API fallback is available
          resolve(true)
        })

      } catch (error: any) {
        console.warn('[Socket] Failed to create socket (will use REST API fallback):', error?.message || error)
        // Don't treat as fatal - chat will work via REST API
        this.connectionStatus = { connected: false, error: 'WebSocket unavailable, using REST API' }
        this.isConnecting = false
        this.emit('connectionStatus', this.connectionStatus)
        // Still resolve as true since REST API fallback is available
        resolve(true)
      }
    })
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connectionStatus = { connected: false }
      this.emit('connectionStatus', this.connectionStatus)
      console.log('[Socket] Disconnected')
    }
  }

  // Setup event listeners
  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('authenticated', (data) => {
      console.log('[Socket] Authenticated:', data)
      this.emit('authenticated', data)
    })

    this.socket.on('privateMessage', (message: SocketMessage) => {
      console.log('[Socket] Received message:', message)
      this.emit('privateMessage', message)
    })

    this.socket.on('usersList', (data: { users: string[] }) => {
      console.log('[Socket] Users list updated:', data.users)
      this.emit('usersList', data)
    })

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason)
      this.connectionStatus = { connected: false, reconnecting: true }
      this.emit('connectionStatus', this.connectionStatus)
      this.handleReconnect()
    })

    this.socket.on('error', (error: any) => {
      // Suppress websocket errors - REST API fallback is available
      console.debug('[Socket] WebSocket error (REST API fallback available):', error?.message || error)
      this.connectionStatus = { connected: false, error: 'WebSocket unavailable, using REST API' }
      this.emit('connectionStatus', this.connectionStatus)
    })
  }

  // Handle automatic reconnection
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      console.log(`[Socket] Reconnecting... attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`)

      setTimeout(() => {
        // Only reconnect if we're still disconnected and have a user email
        if (!this.socket?.connected && this.userEmail && !this.connectionStatus.connected) {
          console.log(`[Socket] Attempting reconnection for ${this.userEmail}`)
          this.connect(this.userEmail)
        } else if (this.socket?.connected) {
          console.log(`[Socket] Already reconnected, stopping reconnection attempts`)
          this.reconnectAttempts = 0
        }
      }, delay)
    } else {
      console.error('[Socket] Max reconnection attempts reached')
      this.connectionStatus = { connected: false, error: 'Unable to reconnect' }
      this.emit('connectionStatus', this.connectionStatus)
    }
  }

  // Send private message
  sendPrivateMessage(message: {
    to: string
    text: string
    timestamp?: string
  }): Promise<{ success: boolean; error?: string; timestamp?: string }> {
    return new Promise(async (resolve) => {
      // If socket is connected, use websocket
      if (this.socket?.connected) {
        this.socket!.emit('privateMessage', message, (response: any) => {
          if (response?.error) {
            resolve({ success: false, error: response.error })
          } else {
            resolve({
              success: true,
              timestamp: response?.timestamp || message.timestamp
            })
          }
        })
        return
      }

      // Fallback to REST API if websocket is not available
      try {
        console.log('[Socket] WebSocket not available, using REST API fallback')
        const response = await fetch('/api/chat/messages/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: this.userEmail,
            to: message.to,
            text: message.text,
            timestamp: message.timestamp || new Date().toISOString(),
          }),
        })

        const data = await response.json()
        if (data.success) {
          resolve({
            success: true,
            timestamp: data.data?.timestamp || message.timestamp
          })
        } else {
          resolve({ success: false, error: data.error || 'Failed to send message' })
        }
      } catch (error: any) {
        console.error('[Socket] REST API fallback failed:', error)
        resolve({ success: false, error: error?.message || 'Failed to send message' })
      }
    })
  }

  // Get list of online users
  getOnlineUsers(): Promise<string[]> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve([])
        return
      }

      this.socket!.emit('getUsers', (response: { users: string[] }) => {
        resolve(response.users || [])
      })
    })
  }

  // Join a chat room
  joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinRoom', { roomId })
    }
  }

  // Leave a chat room
  leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveRoom', { roomId })
    }
  }

  // Get chat history from server
  getChatHistory(contactEmail: string, limit: number, offset: number): Promise<any[]> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve([])
        return
      }

      this.socket!.emit('getChatHistory', { contactEmail, limit, offset }, (response: any) => {
        if (response?.success) {
          resolve(response.messages || [])
        } else {
          resolve([])
        }
      })
    })
  }

  // Send typing indicator
  sendTypingIndicator(to: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { to, isTyping })
    }
  }

  // Mark message as read
  markAsRead(messageId: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) {
        resolve({ success: false, error: 'Not connected' })
        return
      }

      this.socket!.emit('markAsRead', { messageId }, (response: any) => {
        if (response?.success) {
          resolve({ success: true })
        } else {
          resolve({ success: false, error: 'Failed to mark as read' })
        }
      })
    })
  }

  // Check if user is online
  isUserOnline(username: string): boolean {
    return false // This would be tracked on the client side
  }

  // Event emitter pattern
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`[Socket] Error in event callback for ${event}:`, error)
        }
      })
    }
  }

  // Get current connection status
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false
  }

  // Get current user email
  getUserEmail(): string {
    return this.userEmail
  }
}

// Singleton instance
const socketService = new SocketService()

export default socketService
export { SocketService }