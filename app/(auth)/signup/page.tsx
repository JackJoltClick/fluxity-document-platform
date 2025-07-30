'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import { useAuthStore } from '@/src/stores/auth.store'

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { setUser } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Check if email confirmation is required
        if (authData.user.email_confirmed_at) {
          setUser(authData.user)
          router.push('/dashboard')
        } else {
          setSuccess('Please check your email to confirm your account before signing in.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-light text-gray-900 tracking-tight">
          Create account
        </h2>
        <p className="mt-3 text-base text-gray-500 font-light">
          Get started with your document intelligence platform
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

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700 font-medium">{success}</p>
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
            autoComplete="new-password"
            className="stripe-input"
            placeholder="Create a secure password"
          />
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
          )}
          <p className="mt-2 text-sm text-gray-500 font-light">
            Must be at least 6 characters long
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="stripe-label">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword')}
            type="password"
            autoComplete="new-password"
            className="stripe-input"
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="flex items-start space-x-3">
          <input
            id="agree-terms"
            name="agree-terms"
            type="checkbox"
            className="h-4 w-4 text-gray-800 focus:ring-gray-800 border-gray-300 rounded mt-1"
          />
          <label htmlFor="agree-terms" className="text-sm text-gray-700 font-medium leading-relaxed">
            I agree to the{' '}
            <a href="#" className="text-gray-900 hover:text-gray-700 underline transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-gray-900 hover:text-gray-700 underline transition-colors">
              Privacy Policy
            </a>
          </label>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="stripe-button stripe-button-primary w-full py-4 text-base"
          >
            {isLoading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </div>
            ) : (
              'Create account'
            )}
          </button>
        </div>
      </form>

      <div className="text-center pt-6 border-t border-gray-100">
        <span className="text-base text-gray-500 font-light">Already have an account? </span>
        <Link
          href="/login"
          className="text-base font-medium text-gray-900 hover:text-gray-700 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </div>
  )
}