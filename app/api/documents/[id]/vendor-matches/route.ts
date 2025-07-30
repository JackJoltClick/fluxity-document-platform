import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VendorMatchingService } from '@/src/services/vendor-matching/vendor-matching.service'
import { VendorMatchingRequest } from '@/src/types/vendor-matching'

const vendorMatchingService = new VendorMatchingService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const matches = await vendorMatchingService.getDocumentVendorMatches(documentId)

    return NextResponse.json({
      success: true,
      data: matches
    })

  } catch (error) {
    console.error('Error fetching vendor matches:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vendor matches' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const body: Omit<VendorMatchingRequest, 'document_id'> = await request.json()

    const matchRequest: VendorMatchingRequest = {
      document_id: documentId,
      vendor_id: body.vendor_id,
      confidence: body.confidence,
      is_confirmed: body.is_confirmed || false
    }

    const match = await vendorMatchingService.createVendorMatch(matchRequest)

    return NextResponse.json({
      success: true,
      data: match
    })

  } catch (error) {
    console.error('Error creating vendor match:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create vendor match' },
      { status: 500 }
    )
  }
}