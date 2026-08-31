'use client'
import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { getSession } from '@/lib/auth-client'
import { getUserRole } from '@/lib/user-role'
// Removed cookie imports since we're using localStorage now

interface AuthDebugInfoProps {
  showDetailedInfo?: boolean
  className?: string
}

export function AuthDebugInfo({ showDetailedInfo = false, className = '' }: AuthDebugInfoProps) {
  const [authState, setAuthState] = useState({
    session: null as any,
    role: null as string | null,
    hasLocalStorage: false,
    hasSessionStorage: false,
    localStorageValue: '',
    sessionStorageValue: '',
    jwtValid: false,
    error: null as string | null
  })
  const [expanded, setExpanded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkAuthState = async () => {
    try {
      setIsRefreshing(true)
      const session = await getSession()
      const role = getUserRole()
      const localStorageValue = typeof window !== 'undefined' ? localStorage.getItem('sid') || '' : ''
      const sessionStorageValue = typeof window !== 'undefined' ? sessionStorage.getItem('sid') || '' : ''

      let jwtValid = false
      if (localStorageValue) {
        try {
          // Basic JWT check - just verify it's not expired
          const parts = localStorageValue.split('.')
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]))
            jwtValid = payload.exp * 1000 > Date.now()
          }
        } catch (error) {
          console.error('JWT validation error:', error)
        }
      }

      setAuthState({
        session,
        role,
        hasLocalStorage: !!localStorageValue,
        hasSessionStorage: !!sessionStorageValue,
        localStorageValue,
        sessionStorageValue,
        jwtValid,
        error: null
      })
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    checkAuthState()
  }, [])

  const copyDebugInfo = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      authState,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2))
    alert('Debug information copied to clipboard!')
  }

  const getStatusIcon = (isValid: boolean) => {
    return isValid ?
      <CheckCircle className="w-4 h-4 text-green-500" /> :
      <AlertCircle className="w-4 h-4 text-red-500" />
  }

  const maskedValue = (value: string) => {
    if (!value || !expanded) return value ? '••••••••••••••••••••••••••••••••' : ''
    return value.length > 20 ? value.substring(0, 20) + '...' : value
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-blue-900 flex items-center">
          🔐 Authentication Debug Information
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:text-blue-800"
            title={expanded ? 'Hide details' : 'Show details'}
          >
            {expanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={checkAuthState}
            disabled={isRefreshing}
            className="text-xs text-blue-600 hover:text-blue-800"
            title="Refresh auth state"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={copyDebugInfo}
            className="text-xs text-blue-600 hover:text-blue-800"
            title="Copy debug info"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(!!authState.session)}
          <span className="text-gray-700">Session</span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(!!authState.role)}
          <span className="text-gray-700">Role</span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(authState.hasLocalStorage)}
          <span className="text-gray-700">LocalStorage</span>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(authState.jwtValid)}
          <span className="text-gray-700">JWT Valid</span>
        </div>
      </div>

      {/* Basic Info */}
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">User Email:</span>
          <span className="text-gray-800">
            {authState.session?.email || '❌ Not authenticated'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">User Role:</span>
          <span className="text-gray-800">
            {authState.role || '❌ No role set'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">User ID:</span>
          <span className="text-gray-800 font-mono text-xs">
            {authState.session?.userId || 'N/A'}
          </span>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetailedInfo && expanded && (
        <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
          {/* Session Storage Locations */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Session Storage Locations:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">localStorage:</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(authState.hasLocalStorage)}
                  <span className="font-mono text-gray-800">
                    {maskedValue(authState.localStorageValue)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">sessionStorage:</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(authState.hasSessionStorage)}
                  <span className="font-mono text-gray-800">
                    {maskedValue(authState.sessionStorageValue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* JWT Information */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">JWT Token:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Valid:</span>
                <span className={authState.jwtValid ? 'text-green-600' : 'text-red-600'}>
                  {authState.jwtValid ? '✅ Valid' : '❌ Invalid/Expired'}
                </span>
              </div>
              {authState.localStorageValue && (
                <div>
                  <span className="text-gray-600">Full Token:</span>
                  <div className="mt-1 p-2 bg-gray-100 rounded text-xs font-mono break-all">
                    {expanded ? authState.localStorageValue : maskedValue(authState.localStorageValue)}
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Error Information */}
          {authState.error && (
            <div>
              <h4 className="text-sm font-medium text-red-700 mb-2">Error:</h4>
              <p className="text-xs text-red-600">{authState.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={checkAuthState}
            disabled={isRefreshing}
            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
          >
            Reload Page
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  )
}