import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
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

    const documentId = params.id
    const lineItemIndex = parseInt(params.index)

    // Get the GL assignment for this line item
    const { data: assignment, error } = await supabaseAdmin
      .from('document_gl_assignments')
      .select(`
        *,
        gl_account:gl_accounts(*)
      `)
      .eq('document_id', documentId)
      .eq('line_item_index', lineItemIndex)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error
    }

    return NextResponse.json({
      success: true,
      data: assignment || null
    })
  } catch (error) {
    console.error('Error fetching GL assignment:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
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

    const documentId = params.id
    const lineItemIndex = parseInt(params.index)
    const { gl_account_id, line_item_description } = await request.json()

    if (!gl_account_id || !line_item_description) {
      return NextResponse.json(
        { success: false, error: 'GL account ID and line item description are required' },
        { status: 400 }
      )
    }

    // Upsert the GL assignment
    const { data: assignment, error } = await supabaseAdmin
      .from('document_gl_assignments')
      .upsert({
        document_id: documentId,
        line_item_index: lineItemIndex,
        line_item_description,
        gl_account_id,
        assigned_by: user.id
      }, {
        onConflict: 'document_id,line_item_index'
      })
      .select(`
        *,
        gl_account:gl_accounts(*)
      `)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: assignment
    })
  } catch (error) {
    console.error('Error assigning GL account:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; index: string } }
) {
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

    const documentId = params.id
    const lineItemIndex = parseInt(params.index)

    const { error } = await supabaseAdmin
      .from('document_gl_assignments')
      .delete()
      .eq('document_id', documentId)
      .eq('line_item_index', lineItemIndex)

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'GL assignment removed successfully'
    })
  } catch (error) {
    console.error('Error removing GL assignment:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}