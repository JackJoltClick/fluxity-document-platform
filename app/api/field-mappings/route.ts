import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Fetch user's custom field mappings
    const { data: mappings, error: fetchError } = await supabase
      .from('user_field_mappings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching field mappings:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch field mappings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mappings: mappings || []
    })

  } catch (error) {
    console.error('Field mappings GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
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

    // Parse request body
    const body = await request.json()
    const { sourceKey, targetField, confidence = 1.0 } = body

    if (!sourceKey || !targetField) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if mapping already exists
    const { data: existing } = await supabase
      .from('user_field_mappings')
      .select('id')
      .eq('user_id', user.id)
      .eq('source_key', sourceKey)
      .single()

    if (existing) {
      // Update existing mapping
      const { data: updated, error: updateError } = await supabase
        .from('user_field_mappings')
        .update({
          target_field: targetField,
          confidence,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating field mapping:', updateError)
        return NextResponse.json(
          { success: false, error: 'Failed to update field mapping' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        mapping: updated
      })
    } else {
      // Create new mapping
      const { data: created, error: createError } = await supabase
        .from('user_field_mappings')
        .insert({
          user_id: user.id,
          source_key: sourceKey,
          target_field: targetField,
          confidence,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating field mapping:', createError)
        return NextResponse.json(
          { success: false, error: 'Failed to create field mapping' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        mapping: created
      })
    }

  } catch (error) {
    console.error('Field mappings POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mappingId = searchParams.get('id')

    if (!mappingId) {
      return NextResponse.json(
        { success: false, error: 'Missing mapping ID' },
        { status: 400 }
      )
    }

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

    // Delete the mapping
    const { error: deleteError } = await supabase
      .from('user_field_mappings')
      .delete()
      .eq('id', mappingId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting field mapping:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete field mapping' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Field mapping deleted successfully'
    })

  } catch (error) {
    console.error('Field mappings DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}