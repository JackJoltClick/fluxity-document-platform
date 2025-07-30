import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedSupabase } from '@/src/lib/supabase/auth-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`🔍 Status API: Checking status for document ${params.id}`)

    // Get authenticated user and supabase client
    const { supabase, user } = await getAuthenticatedSupabase(request)
    console.log(`👤 Status API: Authenticated user: ${user.email}`)

    // Fetch document status from database
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, filename, status, created_at, updated_at, error_message, extraction_method, extraction_cost')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()

    if (docError) {
      console.error('❌ Status API: Error fetching document:', docError)
      return NextResponse.json(
        { error: 'Document not found', details: docError.message },
        { status: 404 }
      )
    }

    if (!document) {
      console.log(`❌ Status API: Document ${params.id} not found for user ${user.id}`)
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    console.log(`✅ Status API: Document ${params.id} status: ${document.status}`)

    // Calculate processing time for completed/failed documents
    let processingTime: number | undefined
    if (document.status === 'completed' || document.status === 'failed') {
      const createdAt = new Date(document.created_at).getTime()
      const updatedAt = new Date(document.updated_at).getTime()
      processingTime = updatedAt - createdAt
    }

    // Return document status information
    const statusResponse = {
      success: true,
      document: {
        id: document.id,
        filename: document.filename,
        status: document.status,
        created_at: document.created_at,
        updated_at: document.updated_at,
        processing_time: processingTime,
        error_message: document.error_message,
        extraction_method: document.extraction_method,
        extraction_cost: document.extraction_cost
      }
    }

    return NextResponse.json(statusResponse)

  } catch (error) {
    console.error('💥 Status API: Unexpected error:', error)
    
    // Handle authentication errors
    if (error instanceof Error && (
      error.message.includes('Authorization header required') ||
      error.message.includes('Bearer token required') ||
      error.message.includes('Invalid or expired token')
    )) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}