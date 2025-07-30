import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GLService } from '@/src/services/gl/gl.service'
import { CreateGLAccountRequest, GLAccountSearchParams } from '@/src/types/gl-account.types'

const glService = new GLService()

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryParams: GLAccountSearchParams = {
      q: searchParams.get('q') || undefined,
      department: searchParams.get('department') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    }

    const glAccounts = await glService.searchGLAccounts(queryParams)

    return NextResponse.json({
      success: true,
      data: glAccounts
    })
  } catch (error) {
    console.error('Error fetching GL accounts:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const glAccountData: CreateGLAccountRequest = await request.json()

    // Validate required fields
    if (!glAccountData.code || !glAccountData.name) {
      return NextResponse.json(
        { success: false, error: 'Code and name are required' },
        { status: 400 }
      )
    }

    const glAccount = await glService.createGLAccount(glAccountData)

    return NextResponse.json({
      success: true,
      data: glAccount
    })
  } catch (error) {
    console.error('Error creating GL account:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}