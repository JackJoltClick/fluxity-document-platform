import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VendorExtractionRulesService } from '@/src/services/vendors/vendor-extraction-rules.service'

const vendorExtractionRulesService = new VendorExtractionRulesService()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ruleId } = params

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const rule = await vendorExtractionRulesService.getExtractionRuleById(ruleId)

    if (!rule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Get extraction rule error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch extraction rule' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ruleId } = params

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      rule_type,
      instruction,
      is_active
    } = body

    const updates: any = {}
    if (rule_type !== undefined) updates.rule_type = rule_type
    if (instruction !== undefined) updates.instruction = instruction
    if (is_active !== undefined) updates.is_active = is_active

    const rule = await vendorExtractionRulesService.updateExtractionRule(ruleId, updates)

    return NextResponse.json({
      success: true,
      rule
    })
  } catch (error) {
    console.error('Update extraction rule error:', error)
    return NextResponse.json(
      { error: 'Failed to update extraction rule' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; ruleId: string } }
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ruleId } = params

    if (!ruleId) {
      return NextResponse.json({ error: 'Rule ID is required' }, { status: 400 })
    }

    await vendorExtractionRulesService.deleteExtractionRule(ruleId)

    return NextResponse.json({
      success: true,
      message: 'Extraction rule deleted successfully'
    })
  } catch (error) {
    console.error('Delete extraction rule error:', error)
    return NextResponse.json(
      { error: 'Failed to delete extraction rule' },
      { status: 500 }
    )
  }
}