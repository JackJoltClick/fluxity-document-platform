import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/src/lib/supabase/client'

interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  clearUser: () => void
  initializeAuth: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isLoading: true,
  setUser: (user) => {
    console.log('🗃️ AUTH TEST: Setting user in store')
    console.log('📧 Email:', user?.email)
    console.log('🆔 User ID:', user?.id, '(Type:', typeof user?.id, ')')
    console.log('🕐 User created:', user?.created_at)
    console.log('📱 App metadata:', user?.app_metadata)
    console.log('👤 Full user object:', JSON.stringify(user, null, 2))
    set({ user, isLoading: false })
  },
  clearUser: () => {
    console.log('🗃️ Auth store: Clearing user')
    set({ user: null, isLoading: false })
  },
  
  initializeAuth: async () => {
    try {
      console.log('🔄 Auth store: Initializing auth...')
      const currentUser = get().user
      
      // If we already have a user, don't overwrite it
      if (currentUser) {
        console.log('👤 Auth store: User already exists, skipping initialization:', currentUser.email)
        set({ isLoading: false })
        return
      }
      
      const { data: { user } } = await supabase.auth.getUser()
      console.log('👤 Auth store: Got user from Supabase:', user?.email || 'null')
      set({ user, isLoading: false })
    } catch (error) {
      console.error('❌ Error initializing auth:', error)
      set({ user: null, isLoading: false })
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null })
    } catch (error) {
      console.error('Error signing out:', error)
    }
  },

}))

// Listen for auth state changes
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    const { setUser, clearUser } = useAuthStore.getState()
    
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session?.user) {
        setUser(session.user)
      }
    } else if (event === 'SIGNED_OUT') {
      clearUser()
    }
  })
}