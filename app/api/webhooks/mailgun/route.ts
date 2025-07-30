import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { documentQueue } from '@/src/lib/queue/queues'
import { MailgunWebhookData, MailgunAttachment, EmailMetadata } from '@/src/types/email.types'

// Token cache for replay attack prevention
const tokenCache = new Map<string, number>()
const TOKEN_CACHE_TTL = 15 * 60 * 1000 // 15 minutes

// Rate limiting cache
const requestCounts = new Map<string, { count: number, resetTime: number }>()

// Check if token has been used before (replay attack prevention)
function isTokenReused(token: string, timestamp: number): boolean {
  const now = Date.now()
  
  // Clean expired tokens first
  for (const [cachedToken, cachedTime] of Array.from(tokenCache.entries())) {
    if (now - cachedTime > TOKEN_CACHE_TTL) {
      tokenCache.delete(cachedToken)
    }
  }
  
  // Check if token already used
  if (tokenCache.has(token)) {
    return true // Token reused - reject request
  }
  
  // Store token with current timestamp
  tokenCache.set(token, now)
  return false
}

// Validate timestamp to prevent replay attacks
function validateTimestamp(timestamp: string): boolean {
  const now = Math.floor(Date.now() / 1000)
  const webhookTime = parseInt(timestamp, 10)
  
  // Reject requests older than 5 minutes
  if (now - webhookTime > 300) {
    return false
  }
  
  // Reject requests from the future (more than 1 minute)
  if (webhookTime - now > 60) {
    return false
  }
  
  return true
}

// Enhanced Mailgun webhook signature verification with all security checks
function verifyMailgunWebhook(
  timestamp: string, 
  token: string, 
  signature: string,
  signingKey: string
): boolean {
  // 1. Validate timestamp range
  if (!validateTimestamp(timestamp)) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Webhook timestamp validation failed')
    }
    return false
  }
  
  // 2. Check for token replay
  if (isTokenReused(token, parseInt(timestamp))) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Webhook token replay detected')
    }
    return false
  }
  
  // 3. Verify HMAC signature
  try {
    const computedSignature = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp + token)
      .digest('hex')
    
    return computedSignature === signature
  } catch (error) {
    console.error('Signature computation error:', { 
      error: error instanceof Error ? error.message : String(error), 
      timestamp: new Date().toISOString() 
    })
    return false
  }
}

// Rate limiting check
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const limit = 3000 // requests per hour
  const window = 60 * 60 * 1000 // 1 hour
  
  const current = requestCounts.get(ip)
  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + window })
    return true
  }
  
  if (current.count >= limit) {
    return false
  }
  
  current.count++
  return true
}

// Parse multipart form data to extract attachments
async function parseMultipartForm(req: NextRequest): Promise<{
  fields: Record<string, string>
  files: MailgunAttachment[]
}> {
  const formData = await req.formData()
  const fields: Record<string, string> = {}
  const files: MailgunAttachment[] = []
  
  for (const [key, value] of Array.from(formData.entries())) {
    if (value instanceof File) {
      // This is an attachment
      const buffer = Buffer.from(await value.arrayBuffer())
      files.push({
        filename: value.name,
        contentType: value.type,
        size: value.size,
        content: buffer
      })
    } else {
      // This is a form field
      fields[key] = value.toString()
    }
  }
  
  return { fields, files }
}

// Find user by email address (checks both auth.users and email_aliases)
async function findUserByEmail(email: string): Promise<string | null> {
  try {
    // First try the helper function if it exists
    const { data: funcResult, error: funcError } = await supabaseAdmin
      .rpc('find_user_by_email_alias', { email_addr: email })
    
    if (!funcError && funcResult) {
      return funcResult
    }
    
    // Fallback: check auth.users table directly
    const { data: user, error: userError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (!userError && user) {
      return user.id
    }
    
    // Try email_aliases table if available
    const { data: alias, error: aliasError } = await supabaseAdmin
      .from('email_aliases')
      .select('user_id')
      .eq('email_address', email)
      .eq('is_verified', true)
      .single()
    
    if (!aliasError && alias) {
      return alias.user_id
    }
    
    return null
  } catch (error) {
    console.error('Error finding user by email:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return null
  }
}

// Upload attachment to Supabase Storage
async function uploadAttachment(
  attachment: MailgunAttachment,
  userId: string
): Promise<{ url: string; filename: string } | null> {
  try {
    // Generate unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = attachment.filename.split('.').pop()
    const uniqueFilename = `${timestamp}-${randomId}.${extension}`
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('documents')
      .upload(uniqueFilename, attachment.content, {
        contentType: attachment.contentType,
        upsert: false
      })
    
    if (error) {
      console.error('Storage upload error:', {
        error: error.message,
        filename: attachment.filename,
        timestamp: new Date().toISOString()
      })
      return null
    }
    
    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('documents')
      .getPublicUrl(uniqueFilename)
    
    return {
      url: urlData.publicUrl,
      filename: uniqueFilename
    }
  } catch (error) {
    console.error('Upload attachment error:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return null
  }
}

// Create document record in database
async function createEmailDocument(
  userId: string,
  filename: string,
  fileUrl: string,
  emailMetadata: EmailMetadata
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert({
        user_id: userId,
        filename,
        file_url: fileUrl,
        status: 'pending',
        source: 'email',
        email_metadata: emailMetadata
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Database insert error:', {
        error: error.message,
        timestamp: new Date().toISOString()
      })
      return null
    }
    
    return data.id
  } catch (error) {
    console.error('Create document error:', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return null
  }
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Get client IP for rate limiting
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown'
    
    // Check rate limit
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }
    
    // Validate environment configuration
    const signingKey = process.env.MAILGUN_SIGNING_KEY
    if (!signingKey || signingKey === 'your-mailgun-signing-key-here') {
      console.error('Mailgun webhook not properly configured:', {
        timestamp: new Date().toISOString()
      })
      return NextResponse.json(
        { error: 'Mailgun webhook not properly configured' },
        { status: 500 }
      )
    }
    
    // Parse the multipart form data
    const { fields, files } = await parseMultipartForm(req)
    
    // Verify webhook with enhanced security
    const { timestamp, token, signature } = fields
    if (!timestamp || !token || !signature) {
      return NextResponse.json(
        { error: 'Missing required webhook parameters' },
        { status: 400 }
      )
    }
    
    if (!verifyMailgunWebhook(timestamp, token, signature, signingKey)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Mailgun webhook verified')
    }
    
    // Extract email metadata
    const emailMetadata: EmailMetadata = {
      sender: fields.from || fields.sender,
      subject: fields.subject || 'No Subject',
      messageId: fields['Message-Id'],
      receivedDate: new Date().toISOString(),
      originalFilename: undefined
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email metadata:', {
        sender: emailMetadata.sender,
        subject: emailMetadata.subject,
        attachments: files.length
      })
    }
    
    // Find user by sender email
    const userId = await findUserByEmail(emailMetadata.sender)
    if (!userId) {
      if (process.env.NODE_ENV === 'development') {
        console.error('No user found for email:', emailMetadata.sender)
      }
      return NextResponse.json(
        { error: 'Email address not registered' },
        { status: 404 }
      )
    }
    
    // Filter supported file types
    const supportedTypes = ['pdf', 'png', 'jpg', 'jpeg']
    const validAttachments = files.filter(file => {
      const extension = file.filename.split('.').pop()?.toLowerCase()
      return extension && supportedTypes.includes(extension)
    })
    
    if (validAttachments.length === 0) {
      return NextResponse.json(
        { message: 'No supported attachments found' },
        { status: 200 }
      )
    }
    
    // Process each attachment
    const processedDocuments: string[] = []
    const errors: string[] = []
    
    for (const attachment of validAttachments) {
      try {
        // Check file size (50MB limit)
        if (attachment.size > 50 * 1024 * 1024) {
          errors.push(`File ${attachment.filename} too large (${attachment.size} bytes)`)
          continue
        }
        
        // Upload to storage
        const uploadResult = await uploadAttachment(attachment, userId)
        if (!uploadResult) {
          errors.push(`Failed to upload ${attachment.filename}`)
          continue
        }
        
        // Create document record
        const documentId = await createEmailDocument(
          userId,
          uploadResult.filename,
          uploadResult.url,
          {
            ...emailMetadata,
            originalFilename: attachment.filename
          }
        )
        
        if (!documentId) {
          errors.push(`Failed to create document record for ${attachment.filename}`)
          continue
        }
        
        // Add to processing queue with retry logic
        try {
          if (documentQueue) {
            await documentQueue.add('document-processing-job', {
              documentId,
              userId,
              filename: attachment.filename,
              fileUrl: uploadResult.url
            })
            
            processedDocuments.push(documentId)
            
            if (process.env.NODE_ENV === 'development') {
              console.log(`Document ${documentId} queued for processing`)
            }
          } else {
            console.log('Queue not available - marking document as uploaded')
            processedDocuments.push(documentId)
          }
        } catch (queueError) {
          console.error('Failed to queue document:', { 
            error: queueError instanceof Error ? queueError.message : String(queueError),
            documentId,
            timestamp: new Date().toISOString()
          })
          // Return 500 so Mailgun retries the webhook
          return NextResponse.json(
            { error: 'Processing failed, will retry' },
            { status: 500 }
          )
        }
        
      } catch (error) {
        console.error('Error processing attachment:', { 
          error: error instanceof Error ? error.message : String(error),
          filename: attachment.filename,
          timestamp: new Date().toISOString()
        })
        errors.push(`Error processing ${attachment.filename}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${processedDocuments.length} documents`,
      documentsCreated: processedDocuments.length,
      documentIds: processedDocuments,
      errors: errors.length > 0 ? errors : undefined
    })
    
  } catch (error) {
    console.error('Webhook error:', { 
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'mailgun-webhook',
    timestamp: new Date().toISOString()
  })
}