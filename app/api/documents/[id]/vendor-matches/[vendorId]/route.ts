import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VendorMatchingService } from '@/src/services/vendor-matching/vendor-matching.service'

const vendorMatchingService = new VendorMatchingService()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; vendorId: string } }
) {
  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const documentId = params.id
    const vendorId = params.vendorId

    const match = await vendorMatchingService.confirmVendorMatch(documentId, vendorId)

    return NextResponse.json({
      success: true,
      data: match
    })

  } catch (error) {
    console.error('Error confirming vendor match:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to confirm vendor match' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; vendorId: string } }
) {
  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const documentId = params.id
    const vendorId = params.vendorId

    await vendorMatchingService.deleteVendorMatch(documentId, vendorId)

    return NextResponse.json({
      success: true,
      message: 'Vendor match deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting vendor match:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete vendor match' },
      { status: 500 }
    )
  }
}