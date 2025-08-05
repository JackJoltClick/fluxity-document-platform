import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { SQSService } from '@/src/services/queue/sqs.service'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
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
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Fetch the document to verify ownership and get details
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !document) {
      console.error('Document fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Only allow retry for failed documents
    if (document.status !== 'failed') {
      return NextResponse.json(
        { success: false, error: 'Only failed documents can be retried' },
        { status: 400 }
      )
    }

    // Reset document status to pending
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) {
      console.error('Document update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update document status' },
        { status: 500 }
      )
    }

    // Add document back to the SQS processing queue
    try {
      const sqsService = new SQSService()
      const useSQS = await sqsService.isEnabled()
      
      if (useSQS) {
        await sqsService.sendDocumentForProcessing(document.id, user.id)
        console.log(`✅ RETRY: Document ${documentId} added to SQS queue`)
      } else {
        console.log('SQS not available - document status updated to pending')
      }

      // Fetch the updated document to return
      const { data: updatedDocument } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      return NextResponse.json({
        success: true,
        message: 'Document retry initiated successfully',
        document: updatedDocument,
        jobId: null
      })

    } catch (queueError) {
      console.error('Queue error:', queueError)
      
      // Revert document status back to failed if queue fails
      await supabase
        .from('documents')
        .update({ status: 'failed' })
        .eq('id', documentId)

      return NextResponse.json(
        { success: false, error: 'Failed to queue document for retry' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Retry endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}