'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/src/stores/auth.store'

export default function Home() {
  const { user, isLoading, initializeAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Initialize auth when component mounts
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.replace('/dashboard')
      } else {
        // User is not authenticated, redirect to login
        router.replace('/login')
      }
    }
  }, [user, isLoading, router])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-surface">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-text-muted text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  // This shouldn't be reached as useEffect should redirect, but just in case
  return (
    <div className="min-h-screen flex items-center justify-center bg-background-surface">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-text-muted text-sm">Redirecting...</p>
      </div>
    </div>
  )
}
