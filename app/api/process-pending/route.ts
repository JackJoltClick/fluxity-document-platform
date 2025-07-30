import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API: Processing all pending documents')

    // Get all documents with status 'pending' or 'uploaded'
    const { data: pendingDocuments, error: fetchError } = await supabaseAdmin
      .from('documents')
      .select('id, filename, status')
      .in('status', ['pending', 'uploaded'])
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching pending documents:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending documents' },
        { status: 500 }
      )
    }

    if (!pendingDocuments || pendingDocuments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending documents to process',
        processed: 0
      })
    }

    console.log(`📄 API: Found ${pendingDocuments.length} pending documents`)

    const results = []
    
    // Process each document
    for (const doc of pendingDocuments) {
      try {
        console.log(`🔄 API: Processing document ${doc.id} (${doc.filename})`)
        
        // Call the process-document endpoint
        const response = await fetch(`${process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://localhost:3000'}/api/process-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ documentId: doc.id })
        })

        const result = await response.json()
        
        if (result.success) {
          console.log(`✅ API: Document ${doc.id} processed successfully`)
          results.push({
            documentId: doc.id,
            filename: doc.filename,
            success: true,
            processingTime: result.processingTime
          })
        } else {
          console.error(`❌ API: Document ${doc.id} processing failed:`, result.error)
          results.push({
            documentId: doc.id,
            filename: doc.filename,
            success: false,
            error: result.error
          })
        }
      } catch (error) {
        console.error(`❌ API: Error processing document ${doc.id}:`, error)
        results.push({
          documentId: doc.id,
          filename: doc.filename,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    console.log(`📊 API: Processing complete - ${successful} successful, ${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Processed ${pendingDocuments.length} documents`,
      processed: pendingDocuments.length,
      successful,
      failed,
      results
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  try {
    // Get count of pending documents
    const { count, error } = await supabaseAdmin
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'uploaded'])

    if (error) {
      return NextResponse.json(
        { error: 'Failed to check pending documents' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'healthy',
      service: 'process-pending',
      pendingDocuments: count || 0,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}