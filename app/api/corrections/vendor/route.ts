import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CorrectionTrackerService } from '@/src/services/learning/correction-tracker.service'

const correctionTracker = new CorrectionTrackerService()

// POST /api/corrections/vendor - Log a vendor correction with automatic alias creation
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

    const body = await request.json()
    
    // Validate required fields for vendor correction
    const requiredFields = ['documentId', 'originalVendorName', 'correctedVendorId', 'correctedVendorName']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Track vendor correction with automatic alias creation
    const result = await correctionTracker.trackVendorCorrection(
      body.documentId,
      body.originalVendorName,
      body.correctedVendorId,
      body.correctedVendorName,
      user.id
    )

    return NextResponse.json({
      success: true,
      message: 'Vendor correction tracked successfully',
      data: {
        correction: result.correction,
        alias_created: result.aliasCreated
      }
    })

  } catch (error) {
    console.error('❌ API: Error tracking vendor correction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to track vendor correction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}