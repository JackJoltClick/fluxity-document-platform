import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VendorService } from '@/src/services/vendors/vendor.service'

const vendorService = new VendorService()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client with cookies for authentication
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const vendorId = params.id
    const body = await request.json()
    const { alias } = body

    if (!vendorId) {
      return NextResponse.json(
        { success: false, error: 'Vendor ID is required' },
        { status: 400 }
      )
    }

    if (!alias || typeof alias !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Alias is required' },
        { status: 400 }
      )
    }

    const aliasData = await vendorService.addAlias(vendorId, alias.trim())

    return NextResponse.json({
      success: true,
      alias: aliasData,
      message: 'Alias added successfully'
    })
  } catch (error) {
    console.error('❌ POST /api/vendors/[id]/aliases error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to add alias',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Create Supabase client with cookies for authentication
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const url = new URL(request.url)
    const aliasId = url.searchParams.get('aliasId')

    if (!aliasId) {
      return NextResponse.json(
        { success: false, error: 'Alias ID is required' },
        { status: 400 }
      )
    }

    await vendorService.removeAlias(aliasId)

    return NextResponse.json({
      success: true,
      message: 'Alias removed successfully'
    })
  } catch (error) {
    console.error('❌ DELETE /api/vendors/[id]/aliases error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to remove alias',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}