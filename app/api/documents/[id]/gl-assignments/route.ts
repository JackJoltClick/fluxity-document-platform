import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Get all GL assignments for this document
    const { data: assignments, error } = await supabaseAdmin
      .from('document_gl_assignments')
      .select(`
        *,
        gl_account:gl_accounts(*)
      `)
      .eq('document_id', documentId)
      .order('line_item_index')

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data: assignments || []
    })
  } catch (error) {
    console.error('Error fetching GL assignments:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}