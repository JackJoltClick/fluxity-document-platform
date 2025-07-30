import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VendorService } from '@/src/services/vendors/vendor.service'
import { VendorExtractionRulesService } from '@/src/services/vendors/vendor-extraction-rules.service'

const vendorService = new VendorService()
const vendorExtractionRulesService = new VendorExtractionRulesService()

export async function GET(request: NextRequest) {
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

    // Get all vendors
    const vendors = await vendorService.getAllVendors()
    return NextResponse.json({
      success: true,
      vendors,
      total: vendors.length
    })
  } catch (error) {
    console.error('GET /api/vendors error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendors',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { name, tax_id, aliases } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Vendor name is required' },
        { status: 400 }
      )
    }

    const vendor = await vendorService.createVendor({
      name: name.trim(),
      tax_id: tax_id?.trim() || undefined,
      aliases: aliases || []
    })


    return NextResponse.json({
      success: true,
      vendor,
      message: 'Vendor created successfully'
    })
  } catch (error) {
    console.error('POST /api/vendors error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create vendor',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}