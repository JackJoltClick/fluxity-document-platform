import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('smart_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching smart rules:', error)
      return NextResponse.json({ error: 'Failed to fetch smart rules' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/smart-rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { rule_text, category } = body

    // Validate input
    if (!rule_text || !category) {
      return NextResponse.json({ error: 'Rule text and category are required' }, { status: 400 })
    }

    if (rule_text.length > 500) {
      return NextResponse.json({ error: 'Rule text must be 500 characters or less' }, { status: 400 })
    }

    const validCategories = ['gl_assignment', 'cost_center', 'extraction_hint', 'validation']
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('smart_rules')
      .insert({
        user_id: user.id,
        rule_text: rule_text.trim(),
        category,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating smart rule:', error)
      return NextResponse.json({ error: 'Failed to create smart rule' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in POST /api/smart-rules:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}