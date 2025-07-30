import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth: Starting auth check...')
    
    // Log request headers
    const authHeader = request.headers.get('authorization')
    const cookieHeader = request.headers.get('cookie')
    console.log('🔍 Debug Auth: Authorization header present:', !!authHeader)
    console.log('🔍 Debug Auth: Cookie header present:', !!cookieHeader)
    
    const supabase = createRouteHandlerClient({ cookies })
    console.log('🔍 Debug Auth: Supabase client created')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('🔍 Debug Auth: getUser result:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    })

    if (authError || !user) {
      return NextResponse.json({ 
        authenticated: false,
        error: authError?.message || 'No user found',
        headers: {
          hasAuth: !!authHeader,
          hasCookies: !!cookieHeader
        }
      }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.user_metadata?.role || 'user'
      },
      headers: {
        hasAuth: !!authHeader,
        hasCookies: !!cookieHeader
      }
    })
  } catch (error) {
    console.error('🔍 Debug Auth: Error:', error)
    return NextResponse.json(
      { 
        error: 'Auth debug failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}