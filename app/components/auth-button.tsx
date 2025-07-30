'use client'

import { useAuthStore } from '@/src/stores/auth.store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/src/components/design-system/foundations/Button'

export default function AuthButton() {
  const { user, isLoading, signOut, initializeAuth } = useAuthStore()
  const isAuthenticated = user !== null
  const router = useRouter()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-2 border-t-indigo-600 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    )
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-700">
          Welcome, {user?.email}
        </span>
        <Button
          onClick={handleSignOut}
          variant="secondary"
          size="sm"
        >
          Sign Out
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <Button
        onClick={() => router.push('/login')}
        variant="secondary"
        size="sm"
      >
        Sign In
      </Button>
      <Button
        onClick={() => router.push('/signup')}
        variant="primary"
        size="sm"
      >
        Sign Up
      </Button>
    </div>
  )
}