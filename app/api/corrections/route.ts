import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { CorrectionTrackerService, CorrectionData } from '@/src/services/learning/correction-tracker.service'

const correctionTracker = new CorrectionTrackerService()

// POST /api/corrections - Log a correction
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
    
    // Validate required fields
    const requiredFields = ['documentId', 'fieldType', 'originalValue', 'correctedValue']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Validate field type
    const validFieldTypes = ['vendor_match', 'gl_assignment', 'extraction_field']
    if (!validFieldTypes.includes(body.fieldType)) {
      return NextResponse.json(
        { success: false, error: `Invalid field type. Must be one of: ${validFieldTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const correctionData: CorrectionData = {
      documentId: body.documentId,
      fieldType: body.fieldType,
      originalValue: body.originalValue,
      correctedValue: body.correctedValue,
      userId: user.id,
      metadata: body.metadata || {}
    }

    // Log the correction
    const correction = await correctionTracker.logCorrection(correctionData)

    return NextResponse.json({
      success: true,
      message: 'Correction logged successfully',
      data: correction
    })

  } catch (error) {
    console.error('❌ API: Error logging correction:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to log correction',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/corrections - Get corrections with filters
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
    
    const filters = {
      fieldType: searchParams.get('fieldType') || undefined,
      userId: searchParams.get('userId') || undefined,
      documentId: searchParams.get('documentId') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    }

    const corrections = await correctionTracker.getCorrections(filters)

    return NextResponse.json({
      success: true,
      data: corrections,
      count: corrections.length
    })

  } catch (error) {
    console.error('❌ API: Error getting corrections:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get corrections',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

