import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { config } from 'dotenv'

// Load environment variables for worker context
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  config({ path: '.env.local' })
  config({ path: '.env' })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server client with service role for admin operations (worker, system operations)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Create client with user token for user-scoped operations
export function createUserSupabaseClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Get authenticated user and client from request headers
export async function getAuthenticatedSupabase(request: Request) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization header required')
  }

  const token = authHeader.split(' ')[1]
  if (!token) {
    throw new Error('Bearer token required')
  }

  const supabase = createUserSupabaseClient(token)
  
  // Verify the token and get user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    throw new Error(`Invalid or expired token: ${userError?.message || 'No user found'}`)
  }

  return {
    supabase,
    user,
    token
  }
}

// Get authenticated user from cookies (for server components)
export async function getServerUser() {
  const cookieStore = cookies()
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: { user }, error } = await supabase.auth.getUser()
  
  return { user, error, supabase }
}

// Export the service client for backward compatibility
export { supabaseAdmin as supabaseServer }