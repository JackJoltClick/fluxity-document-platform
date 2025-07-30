import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { GLRulesEngineService, LineItemData } from '@/src/services/gl-rules/gl-rules-engine.service'

const glRulesEngine = new GLRulesEngineService()

// POST /api/gl-rules/evaluate - Evaluate line item against all rules
export async function POST(request: NextRequest) {
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

    const lineItemData: LineItemData = await request.json()

    // Validate required fields
    if (!lineItemData.description?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Description is required' },
        { status: 400 }
      )
    }

    // Evaluate line item against user's rules
    const evaluation = await glRulesEngine.evaluateLineItem(
      user.id,
      lineItemData
    )

    return NextResponse.json({
      success: true,
      data: evaluation
    })

  } catch (error) {
    console.error('Error evaluating line item:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}