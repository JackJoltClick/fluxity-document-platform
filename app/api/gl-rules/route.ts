import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { CreateGLRuleRequest, UpdateGLRuleRequest, CompanyGLRule } from '@/src/types/gl-rules.types'
import { GLRulesEngineService } from '@/src/services/gl-rules/gl-rules-engine.service'

const glRulesEngine = new GLRulesEngineService()

// GET /api/gl-rules - List all GL rules for authenticated user
export async function GET(request: NextRequest) {
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

    // Get query parameters
    const url = new URL(request.url)
    const includeStats = url.searchParams.get('include_stats') === 'true'

    // Fetch rules
    const { data: rules, error } = await supabaseAdmin
      .from('company_gl_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('priority', { ascending: false })
      .order('rule_name', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch GL rules' },
        { status: 500 }
      )
    }

    let rulesWithStats = rules

    // If stats requested, fetch application stats for each rule
    if (includeStats && rules.length > 0) {
      const statsPromises = rules.map(async (rule) => {
        try {
          const { data: stats } = await supabaseAdmin
            .rpc('get_rule_application_stats', { rule_uuid: rule.id })
            .single()
          
          return {
            ...rule,
            stats: stats || {
              total_applications: 0,
              successful_applications: 0,
              override_rate: 0,
              last_applied_at: null
            }
          }
        } catch (error) {
          return {
            ...rule,
            stats: {
              total_applications: 0,
              successful_applications: 0,
              override_rate: 0,
              last_applied_at: null
            }
          }
        }
      })

      rulesWithStats = await Promise.all(statsPromises)
    }

    return NextResponse.json({
      success: true,
      data: rulesWithStats,
      count: rules.length
    })

  } catch (error) {
    console.error('Error fetching GL rules:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/gl-rules - Create new GL rule
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

    const body: CreateGLRuleRequest = await request.json()

    // Validate required fields
    if (!body.rule_name?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Rule name is required' },
        { status: 400 }
      )
    }

    if (!body.actions?.gl_code?.trim()) {
      return NextResponse.json(
        { success: false, error: 'GL code is required in actions' },
        { status: 400 }
      )
    }

    // Validate conditions have at least one criterion
    const hasConditions = 
      body.conditions.vendor_patterns?.length ||
      body.conditions.amount_range ||
      body.conditions.keywords?.length ||
      body.conditions.exact_descriptions?.length ||
      body.conditions.date_range

    if (!hasConditions) {
      return NextResponse.json(
        { success: false, error: 'At least one condition must be specified' },
        { status: 400 }
      )
    }

    // Create the rule
    const ruleData = {
      user_id: user.id,
      rule_name: body.rule_name.trim(),
      priority: body.priority || 0,
      is_active: body.is_active !== false, // Default to true
      conditions: body.conditions,
      actions: body.actions
    }

    const { data, error } = await supabaseAdmin
      .from('company_gl_rules')
      .insert(ruleData)
      .select()
      .single()

    if (error) {
      console.error('Database error creating GL rule:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create GL rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'GL rule created successfully'
    })

  } catch (error) {
    console.error('Error creating GL rule:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/gl-rules - Update existing GL rule
export async function PUT(request: NextRequest) {
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

    const body: UpdateGLRuleRequest = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    // Verify rule ownership
    const { data: existingRule, error: fetchError } = await supabaseAdmin
      .from('company_gl_rules')
      .select('id')
      .eq('id', body.id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { success: false, error: 'GL rule not found' },
        { status: 404 }
      )
    }

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (body.rule_name !== undefined) updateData.rule_name = body.rule_name.trim()
    if (body.priority !== undefined) updateData.priority = body.priority
    if (body.is_active !== undefined) updateData.is_active = body.is_active
    if (body.conditions !== undefined) updateData.conditions = body.conditions
    if (body.actions !== undefined) updateData.actions = body.actions

    // Validate if name or actions are being updated
    if (updateData.rule_name && !updateData.rule_name) {
      return NextResponse.json(
        { success: false, error: 'Rule name cannot be empty' },
        { status: 400 }
      )
    }

    if (updateData.actions && !updateData.actions.gl_code?.trim()) {
      return NextResponse.json(
        { success: false, error: 'GL code is required in actions' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('company_gl_rules')
      .update(updateData)
      .eq('id', body.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating GL rule:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update GL rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'GL rule updated successfully'
    })

  } catch (error) {
    console.error('Error updating GL rule:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/gl-rules?id=... - Delete GL rule
export async function DELETE(request: NextRequest) {
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

    const url = new URL(request.url)
    const ruleId = url.searchParams.get('id')

    if (!ruleId) {
      return NextResponse.json(
        { success: false, error: 'Rule ID is required' },
        { status: 400 }
      )
    }

    // Verify rule ownership and get rule info
    const { data: existingRule, error: fetchError } = await supabaseAdmin
      .from('company_gl_rules')
      .select('id, rule_name')
      .eq('id', ruleId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existingRule) {
      return NextResponse.json(
        { success: false, error: 'GL rule not found' },
        { status: 404 }
      )
    }

    // Delete the rule (cascade will handle rule applications)
    const { error } = await supabaseAdmin
      .from('company_gl_rules')
      .delete()
      .eq('id', ruleId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error deleting GL rule:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete GL rule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `GL rule "${existingRule.rule_name}" deleted successfully`
    })

  } catch (error) {
    console.error('Error deleting GL rule:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}