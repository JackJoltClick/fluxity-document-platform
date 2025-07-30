'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import { useAuthStore } from '@/src/stores/auth.store'
import { Button } from '@/src/components/design-system/foundations/Button'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('🔑 Attempting login for:', data.email)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      console.log('📋 Login response:', { 
        user: authData?.user?.email, 
        session: !!authData?.session,
        error: authError?.message 
      })

      if (authError) {
        console.error('❌ Login error:', authError.message)
        setError(authError.message)
        return
      }

      if (authData.user) {
        console.log('✅ Login successful! User:', authData.user.email)
        console.log('📝 Setting user in auth store...')
        setUser(authData.user)
        
        console.log('🔄 Redirecting to dashboard...')
        router.push('/dashboard')
      } else {
        console.error('❌ No user data received')
        setError('Login failed - no user data received')
      }
    } catch (err) {
      console.error('💥 Login catch error:', err)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-3 text-base text-gray-500 font-light">
          Sign in to your account to continue
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        </div>
      )}

      <form className="space-y-7" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="stripe-label">
            Email address
          </label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            className="stripe-input"
            placeholder="Enter your email address"
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="stripe-label">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            autoComplete="current-password"
            className="stripe-input"
            placeholder="Enter your password"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-gray-800 focus:ring-gray-800 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-700 font-medium">
              Remember me
            </label>
          </div>

          <div className="text-sm">
            <a href="#" className="font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Forgot your password?
            </a>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            variant="primary"
            size="lg"
            fullWidth
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </div>
      </form>

      <div className="text-center pt-6 border-t border-gray-100">
        <span className="text-base text-gray-500 font-light">Don't have an account? </span>
        <Link
          href="/signup"
          className="text-base font-medium text-gray-900 hover:text-gray-700 transition-colors"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}