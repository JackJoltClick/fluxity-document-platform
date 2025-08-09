import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB in bytes
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
const DOCUMENTS_BUCKET = 'documents'

// Create Supabase admin client for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload API: Processing file upload request')
    
    // Debug cookie access
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    console.log('🍪 Available cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Check if Supabase auth cookies exist (they should start with sb-)
    const authCookies = allCookies.filter(c => 
      c.name.includes('supabase') || c.name.includes('auth') || c.name.startsWith('sb-')
    )
    console.log('🔐 Auth cookies found:', authCookies.map(c => ({ name: c.name, hasValue: !!c.value })))
    
    // Log all cookie names to find the pattern
    console.log('🔍 All cookie names:', allCookies.map(c => c.name))
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    const schemaId = formData.get('schemaId') as string | null
    
    if (!file) {
      console.error('❌ Upload API: No file provided')
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    console.log('📄 Upload API: File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      schemaId: schemaId || 'legacy'
    })

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.error('❌ Upload API: Invalid file type:', file.type)
      return NextResponse.json(
        { 
          error: 'Invalid file type. Only PDF, PNG, and JPEG files are allowed.',
          allowedTypes: ALLOWED_TYPES
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ Upload API: File too large:', file.size)
      return NextResponse.json(
        { 
          error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          maxSize: MAX_FILE_SIZE
        },
        { status: 400 }
      )
    }

    // Generate unique filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileExt = file.name.split('.').pop()
    const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    console.log('🏷️ Upload API: Generated filename:', uniqueFilename)

    // Ensure documents bucket exists
    console.log('🪣 Upload API: Checking documents bucket...')
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Upload API: Error listing buckets:', listError)
      return NextResponse.json(
        { error: 'Storage service unavailable' },
        { status: 503 }
      )
    }

    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET)
    
    if (!bucketExists) {
      console.log('🆕 Upload API: Creating documents bucket...')
      const { error: createError } = await supabaseAdmin.storage.createBucket(DOCUMENTS_BUCKET, {
        public: true,
        allowedMimeTypes: ALLOWED_TYPES,
        fileSizeLimit: MAX_FILE_SIZE
      })
      
      if (createError) {
        console.error('❌ Upload API: Error creating bucket:', createError)
        return NextResponse.json(
          { error: 'Failed to initialize storage' },
          { status: 500 }
        )
      }
      console.log('✅ Upload API: Documents bucket created successfully')
    }

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    console.log('⬆️ Upload API: Uploading file to Supabase Storage...')
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .upload(uniqueFilename, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('❌ Upload API: Upload failed:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    console.log('✅ Upload API: File uploaded successfully:', uploadData.path)

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseAdmin.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(uploadData.path)

    // Create user Supabase client with proper SSR setup - same as auth/callback
    const userSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`🍪 Getting cookie ${name}:`, cookie ? 'found' : 'not found')
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )

    // Get current user
    const { data: { user }, error: userError } = await userSupabase.auth.getUser()

    console.log('👤 Upload API: User auth check:', {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      error: userError?.message
    })

    if (userError || !user) {
      console.error('❌ Upload API: User not authenticated for database record:', userError)
      // Still return success for file upload, but note the database issue
      const metadata = {
        id: uploadData.path,
        filename: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        bucket: DOCUMENTS_BUCKET,
        path: uploadData.path,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully (database record skipped - no user auth)',
        file: metadata
      })
    }

    // Save document metadata to database with 'pending' status
    console.log('💾 Upload API: Saving document metadata to database...')
    
    try {
      const { data: documentRecord, error: dbError } = await userSupabase
        .from('documents')
        .insert({
          user_id: user.id,
          filename: file.name,
          file_url: urlData.publicUrl,
          status: 'pending',
          client_schema_id: schemaId || null // Add schema ID if provided
        })
        .select()
        .single()

      if (dbError) {
        console.error('❌ Upload API: Database record creation failed:', dbError)
        // Still return success for file upload
        const metadata = {
          id: uploadData.path,
          filename: file.name,
          originalName: file.name,
          size: file.size,
          type: file.type,
          bucket: DOCUMENTS_BUCKET,
          path: uploadData.path,
          url: urlData.publicUrl,
          uploadedAt: new Date().toISOString()
        }

        return NextResponse.json({
          success: true,
          message: 'File uploaded successfully (database record failed)',
          file: metadata,
          dbError: dbError.message
        })
      }

      console.log('✅ Upload API: Document record created successfully:', documentRecord.id)

      // Send to process-document endpoint which will queue in SQS
      console.log('📤 Upload API: Sending document to processing queue')
      
      try {
        const processResponse = await fetch(`${request.nextUrl.origin}/api/process-document`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ documentId: documentRecord.id })
        })
        
        if (!processResponse.ok) {
          console.error('❌ Upload API: Failed to queue document for processing')
        } else {
          console.log('✅ Upload API: Document queued for processing')
        }
      } catch (processError) {
        console.error('❌ Upload API: Error queuing document:', processError)
      }

      const metadata = {
        id: documentRecord.id,
        filename: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        bucket: DOCUMENTS_BUCKET,
        path: uploadData.path,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString(),
        dbId: documentRecord.id,
        status: documentRecord.status // Will be 'queued' if SQS is enabled
      }

      console.log('📋 Upload API: Upload complete with metadata:', metadata)

      return NextResponse.json({
        success: true,
        message: 'File uploaded and queued for processing',
        file: metadata
      })
      
    } catch (dbError) {
      console.error('❌ Upload API: Database operation failed:', dbError)
      
      const metadata = {
        id: uploadData.path,
        filename: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        bucket: DOCUMENTS_BUCKET,
        path: uploadData.path,
        url: urlData.publicUrl,
        uploadedAt: new Date().toISOString()
      }

      return NextResponse.json({
        success: true,
        message: 'File uploaded successfully (database error)',
        file: metadata,
        error: dbError instanceof Error ? dbError.message : 'Unknown database error'
      })
    }

  } catch (error) {
    console.error('❌ Upload API: Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}