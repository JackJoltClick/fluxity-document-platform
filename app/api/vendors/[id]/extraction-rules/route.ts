import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { VendorExtractionRulesService } from '@/src/services/vendors/vendor-extraction-rules.service'
import { PromptSanitizerService } from '@/src/services/security/prompt-sanitizer.service'
import { vendorRulesRateLimiter } from '@/src/lib/rate-limiter'

const vendorExtractionRulesService = new VendorExtractionRulesService()
const promptSanitizer = new PromptSanitizerService()

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
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: vendorId } = params

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    const rules = await vendorExtractionRulesService.getVendorExtractionRules(vendorId)

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Get vendor extraction rules error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor extraction rules' },
      { status: 500 }
    )
  }
}

export async function POST(
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
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is blocked due to security violations
    const isBlocked = await promptSanitizer.shouldBlockUser(user.id)
    if (isBlocked) {
      return NextResponse.json({ 
        error: 'Account temporarily blocked due to security violations' 
      }, { status: 403 })
    }

    // Rate limiting
    const rateLimitResult = await vendorRulesRateLimiter.checkLimit(request, user.id)
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: rateLimitResult.retryAfter 
      }, { 
        status: 429,
        headers: {
          'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
        }
      })
    }

    const { id: vendorId } = params

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const {
      rule_type,
      instruction
    } = body

    if (!rule_type || !instruction) {
      return NextResponse.json({ error: 'Rule type and instruction are required' }, { status: 400 })
    }

    // Security validation
    const validationResult = promptSanitizer.validateRuleContent(instruction, rule_type)
    if (!validationResult.valid) {
      // Log security violation
      await promptSanitizer.logSecurityViolation(
        user.id,
        'invalid_rule_content',
        instruction,
        request.headers.get('x-forwarded-for') || undefined
      )
      
      return NextResponse.json({ 
        error: validationResult.error || 'Invalid instruction content' 
      }, { status: 400 })
    }

    // Sanitize instruction before saving
    const sanitizedInstruction = promptSanitizer.sanitizeForLLMPrompt(instruction)
    
    if (sanitizedInstruction.includes('[INSTRUCTION REMOVED')) {
      // Log security violation
      await promptSanitizer.logSecurityViolation(
        user.id,
        'dangerous_content_blocked',
        instruction,
        request.headers.get('x-forwarded-for') || undefined
      )
      
      return NextResponse.json({ 
        error: 'Instruction contains dangerous content and cannot be saved' 
      }, { status: 400 })
    }

    const ruleData = {
      vendor_id: vendorId,
      rule_type,
      instruction: sanitizedInstruction
    }

    const rule = await vendorExtractionRulesService.createExtractionRule(ruleData, user.id)

    return NextResponse.json({
      success: true,
      rule
    })
  } catch (error) {
    console.error('Create vendor extraction rule error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      vendorId: params.id
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to create vendor extraction rule',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}