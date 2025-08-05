import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { documentPatchSchema, sanitizeAccountingValue } from '@/src/lib/validation/accounting.schemas'
import { getAuditLogService } from '@/src/services/audit/audit-log.service'
import { ZodError } from 'zod'

export async function GET(
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

    // Validate document ID format (UUID) - prevents enumeration attacks
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid document ID format' },
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

    // Fetch the document with all fields including accounting data
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

    return NextResponse.json({
      success: true,
      document
    })

  } catch (error) {
    console.error('Document GET endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
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

    // Parse and validate the request body
    const rawUpdateData = await request.json()
    console.log('📥 PATCH: Raw request data received:', rawUpdateData)
    
    let validatedData
    try {
      validatedData = documentPatchSchema.parse(rawUpdateData)
      console.log('✅ PATCH: Data validation passed:', validatedData)
    } catch (error) {
      if (error instanceof ZodError) {
        console.error('❌ PATCH: Validation failed:', error.issues)
        return NextResponse.json(
          { 
            success: false, 
            error: 'Validation failed',
            details: error.issues.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Fetch current document to compare values for audit logging
    const { data: currentDocument, error: fetchCurrentError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (fetchCurrentError || !currentDocument) {
      console.error('Document fetch error:', fetchCurrentError)
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Sanitize and prepare update data
    const sanitizedUpdateData = Object.keys(validatedData).reduce((obj, key) => {
      const value = validatedData[key as keyof typeof validatedData]
      obj[key] = sanitizeAccountingValue(key, value)
      return obj
    }, {} as Record<string, any>)

    // Add updated timestamp
    sanitizedUpdateData.updated_at = new Date().toISOString()
    
    console.log('🧹 PATCH: Sanitized update data:', sanitizedUpdateData)

    // Update the document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('documents')
      .update(sanitizedUpdateData)
      .eq('id', documentId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ PATCH: Document update error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      )
    }

    console.log('📄 PATCH: Updated document result:', {
      id: updatedDocument?.id,
      accounting_status: updatedDocument?.accounting_status,
      requires_review: updatedDocument?.requires_review,
      updated_at: updatedDocument?.updated_at
    })

    if (!updatedDocument) {
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' },
        { status: 404 }
      )
    }

    // Audit log all field changes
    const auditService = getAuditLogService()
    const auditPromises = Object.keys(validatedData).map(async (fieldName) => {
      const oldValue = currentDocument[fieldName as keyof typeof currentDocument]
      const newValue = sanitizedUpdateData[fieldName]
      
      // Only log if value actually changed
      if (oldValue !== newValue) {
        await auditService.logFieldChange({
          document_id: documentId,
          field_name: fieldName,
          input_value: oldValue,
          output_value: newValue,
          confidence_score: fieldName === 'mapping_confidence' ? newValue : 1.0, // Manual edits have high confidence
          reasoning: 'Manual field update via UI',
          mapping_source: 'manual_edit'
        })
      }
    })

    // Wait for audit logging (but don't fail if it errors)
    try {
      await Promise.all(auditPromises)
    } catch (auditError) {
      console.error('Audit logging failed:', auditError)
      // Continue - don't fail the main operation
    }

    console.log(`✅ PATCH: Document ${documentId} updated successfully with ${Object.keys(validatedData).length} fields`)

    return NextResponse.json({
      success: true,
      message: 'Document updated successfully',
      document: updatedDocument,
      fieldsUpdated: Object.keys(validatedData)
    })

  } catch (error) {
    console.error('Document PATCH endpoint error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}