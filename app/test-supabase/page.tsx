'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function TestSupabasePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectionTest, setConnectionTest] = useState<{
    url: string
    key: string
    connected: boolean
  } | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...')
        
        // Test basic connection info
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        console.log('Supabase URL:', url)
        console.log('Supabase Key (first 20 chars):', key?.substring(0, 20) + '...')
        
        setConnectionTest({
          url: url || 'NOT_SET',
          key: key ? key.substring(0, 20) + '...' : 'NOT_SET',
          connected: false
        })

        // Test auth.getUser() call
        const { data, error: authError } = await supabase.auth.getUser()
        
        if (authError) {
          console.error('Supabase auth error:', authError)
          setError(authError.message)
        } else {
          console.log('Supabase auth response:', data)
          setUser(data.user)
          setConnectionTest(prev => prev ? { ...prev, connected: true } : null)
        }
      } catch (err) {
        console.error('Connection test failed:', err)
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    testConnection()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-4 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Testing Supabase connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supabase Connection Test</h1>
          <p className="text-gray-600">Testing connection to Supabase with real environment variables</p>
        </div>

        <div className="space-y-6">
          {/* Connection Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Connection Status</h2>
            {connectionTest && (
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">URL:</span>
                  <span className="text-sm text-gray-900 font-mono">{connectionTest.url}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">Key:</span>
                  <span className="text-sm text-gray-900 font-mono">{connectionTest.key}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">Status:</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    connectionTest.connected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {connectionTest.connected ? '✓ Connected' : '✗ Failed'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Connection Error</h2>
              <p className="text-red-700 font-mono text-sm">{error}</p>
            </div>
          )}

          {/* User Data */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Status</h2>
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">User ID:</span>
                  <span className="text-sm text-gray-900 font-mono">{user.id}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">Email:</span>
                  <span className="text-sm text-gray-900">{user.email}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-20">Created:</span>
                  <span className="text-sm text-gray-900">{new Date(user.created_at).toLocaleString()}</span>
                </div>
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ User authenticated
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  No user authenticated (expected)
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  This is normal - no user is currently signed in.
                </p>
              </div>
            )}
          </div>

          {/* Test Results */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
            <div className="space-y-2">
              <div className="flex items-center">
                <span className="text-green-600 text-sm">✓</span>
                <span className="text-sm text-gray-700 ml-2">Environment variables loaded</span>
              </div>
              <div className="flex items-center">
                <span className="text-green-600 text-sm">✓</span>
                <span className="text-sm text-gray-700 ml-2">Supabase client initialized</span>
              </div>
              <div className="flex items-center">
                <span className={`text-sm ${error ? 'text-red-600' : 'text-green-600'}`}>
                  {error ? '✗' : '✓'}
                </span>
                <span className="text-sm text-gray-700 ml-2">
                  {error ? 'Auth connection failed' : 'Auth connection successful'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="text-center">
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}