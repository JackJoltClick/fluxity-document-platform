import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Security: Rate limiting constants
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20
const requestCounts = new Map<string, { count: number; resetTime: number }>()

// Security: Input sanitization
function sanitizeRuleText(text: string): string {
  // Remove any potential SQL/script injection attempts
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove HTML brackets
    .replace(/(\r\n|\n|\r)/gm, ' ') // Normalize line breaks
    .substring(0, 500) // Enforce max length
}

// Security: Rate limiting helper
function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = requestCounts.get(userId)
  
  if (!userRequests || now > userRequests.resetTime) {
    requestCounts.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }
  
  if (userRequests.count >= MAX_REQUESTS_PER_WINDOW) {
    return false
  }
  
  userRequests.count++
  return true
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Security: Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data, error } = await supabase
      .from('smart_rules')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100) // Security: Limit results to prevent data dumps

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

    // Security: Rate limiting
    if (!checkRateLimit(user.id)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Security: Check total rules count per user
    const { count } = await supabase
      .from('smart_rules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    
    if (count && count >= 50) {
      return NextResponse.json({ error: 'Maximum rules limit reached (50)' }, { status: 400 })
    }

    const body = await request.json()
    const { rule_text, category } = body

    // Validate input
    if (!rule_text || !category) {
      return NextResponse.json({ error: 'Rule text and category are required' }, { status: 400 })
    }

    if (typeof rule_text !== 'string' || typeof category !== 'string') {
      return NextResponse.json({ error: 'Invalid input types' }, { status: 400 })
    }

    // Security: Sanitize input
    const sanitizedText = sanitizeRuleText(rule_text)
    
    if (sanitizedText.length < 3) {
      return NextResponse.json({ error: 'Rule text must be at least 3 characters' }, { status: 400 })
    }

    if (sanitizedText.length > 500) {
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
        rule_text: sanitizedText,
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