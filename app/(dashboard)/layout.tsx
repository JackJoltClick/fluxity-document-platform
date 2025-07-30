'use client'

import { useAuthStore } from '@/src/stores/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from './components/sidebar'
import { QueryProvider } from '@/src/providers/QueryProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, initializeAuth } = useAuthStore()
  const isAuthenticated = user !== null
  const router = useRouter()

  useEffect(() => {
    console.log('🏠 Dashboard layout: Initializing auth...')
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    console.log('🔍 Dashboard auth state check:')
    console.log('  - isLoading:', isLoading)
    console.log('  - isAuthenticated:', isAuthenticated)
    console.log('  - userEmail:', user?.email)
    console.log('  - userId:', user?.id)
    
    if (!isLoading && !isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to login...')
      router.push('/login')
    } else if (!isLoading && isAuthenticated) {
      console.log('✅ User is authenticated, showing dashboard')
    }
  }, [isLoading, isAuthenticated, router, user])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" data-testid="auth-loading">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-4 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="dashboard-layout">
      {/* Main Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Sophisticated Top Header - Square-inspired */}
          <header className="bg-white border-b border-gray-100 shadow-sm">
            <div className="px-8 py-6">
              <div className="flex items-center justify-between">
                {/* Dynamic page title */}
                <div className="flex items-center space-x-6">
                  <h1 className="text-3xl font-light text-gray-900 tracking-tight">Dashboard</h1>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-gray-800 rounded-full"></div>
                    <span className="text-sm text-gray-500 font-medium">Live system status</span>
                  </div>
                </div>
                
                {/* Sophisticated user section */}
                <div className="flex items-center space-x-6">
                  {/* Quick actions */}
                  <div className="flex items-center space-x-3">
                    <button className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5-5 5h5v0z" />
                      </svg>
                    </button>
                    <button className="p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200 group">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5-5-5 5h5v0z" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Divider */}
                  <div className="w-px h-8 bg-gray-200"></div>
                  
                  {/* User profile */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900" data-testid="user-email">
                        {user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-medium text-white">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6">
            <QueryProvider>
              {children}
            </QueryProvider>
          </main>
        </div>
      </div>
    </div>
  )
}