import { NextRequest, NextResponse } from 'next/server'
import { CorrectionTrackerService } from '@/src/services/learning/correction-tracker.service'

export const dynamic = 'force-dynamic'

const correctionTracker = new CorrectionTrackerService()

// GET /api/corrections/patterns - Get correction patterns for learning
export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const patternType = searchParams.get('type') // 'vendor' or 'gl'
    const userId = searchParams.get('userId') || undefined

    if (!patternType) {
      return NextResponse.json(
        { success: false, error: 'Missing pattern type parameter' },
        { status: 400 }
      )
    }

    let patterns
    if (patternType === 'vendor') {
      patterns = await correctionTracker.getVendorCorrectionPatterns(userId)
    } else if (patternType === 'gl') {
      patterns = await correctionTracker.getGLCorrectionPatterns(userId)
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid pattern type. Must be "vendor" or "gl"' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: patterns,
      count: patterns.length
    })

  } catch (error) {
    console.error('❌ API: Error getting correction patterns:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get correction patterns',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}