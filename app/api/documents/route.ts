import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/src/lib/supabase/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    console.log('📋 Documents API: Fetching user documents')
    
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    console.log('📋 Documents API: Auth header:', authHeader ? 'exists' : 'missing')
    console.log('📋 Documents API: Token:', token ? 'exists' : 'missing')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No auth token provided' },
        { status: 401 }
      )
    }

    // Create supabase client with token
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ Documents API: User not authenticated:', userError)
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    console.log('👤 Documents API: Fetching documents for user:', user.id)

    // Fetch documents for the user
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (documentsError) {
      console.error('❌ Documents API: Error fetching documents:', documentsError)
      
      // If table doesn't exist, return empty array and let the user know
      if (documentsError.code === 'PGRST116' || documentsError.message.includes('does not exist')) {
        console.log('📋 Documents API: Table does not exist, returning empty array')
        return NextResponse.json({
          success: true,
          documents: [],
          total: 0,
          message: 'Documents table not found. Please create it using the provided SQL script.'
        })
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch documents', details: documentsError.message },
        { status: 500 }
      )
    }

    console.log(`📋 Documents API: Found ${documents?.length || 0} documents`)

    return NextResponse.json({
      success: true,
      documents: documents || [],
      total: documents?.length || 0
    })

  } catch (error) {
    console.error('💥 Documents API: Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 Documents API: Creating new document record')
    
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { error: 'No auth token provided' },
        { status: 401 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get() { return undefined },
          set() {},
          remove() {},
        },
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('❌ Documents API: User not authenticated:', userError)
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { filename, file_url, status = 'uploaded' } = body

    if (!filename || !file_url) {
      return NextResponse.json(
        { error: 'filename and file_url are required' },
        { status: 400 }
      )
    }

    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        filename,
        file_url,
        status
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Documents API: Error creating document:', insertError)
      return NextResponse.json(
        { error: 'Failed to create document record', details: insertError.message },
        { status: 500 }
      )
    }

    console.log('✅ Documents API: Document created successfully:', document.id)

    return NextResponse.json({
      success: true,
      document
    })

  } catch (error) {
    console.error('💥 Documents API: Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}