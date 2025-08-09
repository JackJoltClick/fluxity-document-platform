import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Admin client with service key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: { autoRefreshToken: false, persistSession: false }
  }
)

// Regular client for user auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { name, description, columns } = await request.json()
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    // Extract token and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if this will be the first/default schema
    const { data: existingSchemas } = await supabaseAdmin
      .from('client_schemas')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const isDefault = !existingSchemas || existingSchemas.length === 0

    // Insert using admin client to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('client_schemas')
      .insert({
        user_id: user.id,
        name,
        description: description || null,
        columns,
        is_default: isDefault,
        is_active: true
      })
      .select()

    if (error) {
      console.error('Schema creation error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}