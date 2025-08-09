import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { SQSService } from '@/src/services/queue/sqs.service'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout

export async function POST(request: NextRequest) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

    console.log(`🔄 API: Processing document ${documentId}`)

    // Get document details
    const { data: document, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      console.error('Document fetch error:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    if (document.status === 'completed') {
      return NextResponse.json({
        success: true,
        message: 'Document already processed',
        document
      })
    }

    // Check if SQS is enabled
    const sqsService = new SQSService()
    const useSQS = await sqsService.isEnabled()

    if (!useSQS) {
      return NextResponse.json(
        { error: 'Document processing is currently unavailable. SQS/Lambda processing must be enabled.' },
        { status: 503 }
      )
    }

    try {
      console.log(`📤 API: Using SQS - Queuing document ${documentId} for processing`)
      
      // Update status to queued
      await updateDocumentStatus(documentId, 'queued')
      
      // Send to SQS queue with all required data
      await sqsService.sendDocumentForProcessing(
        documentId, 
        document.user_id,
        document.file_url,
        document.filename
      )
      
      return NextResponse.json({
        success: true,
        message: 'Document queued for processing',
        document: { ...document, status: 'queued' },
        method: 'sqs'
      })
      
    } catch (sqsError) {
      console.error(`❌ API: SQS queueing failed for ${documentId}:`, sqsError)
      return NextResponse.json(
        { 
          success: false, 
          error: `Processing failed: ${sqsError instanceof Error ? sqsError.message : 'SQS error'}`
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions (same as worker)
async function updateDocumentStatus(documentId: string, status: string) {
  const { error } = await supabaseAdmin
    .from('documents')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId)

  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`)
  }

  console.log(`📋 API: Document ${documentId} status updated to: ${status}`)
}

