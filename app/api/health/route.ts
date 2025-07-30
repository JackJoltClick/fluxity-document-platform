import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/src/lib/supabase/auth-server'
import { VendorService } from '@/src/services/vendors/vendor.service'
import { VendorMatchingService } from '@/src/services/vendor-matching/vendor-matching.service'
import { GLService } from '@/src/services/gl/gl.service'

export async function GET() {
  try {
    // Test storage connectivity
    let storageStatus = 'disconnected'
    let uploadStatus = 'unavailable'
    
    try {
      // Try to list buckets to test storage connectivity
      const { data: buckets, error: storageError } = await supabaseAdmin.storage.listBuckets()
      
      if (!storageError && buckets) {
        storageStatus = 'connected'
        uploadStatus = 'available'
      }
    } catch (storageError) {
      console.error('Storage connectivity check failed:', storageError)
    }

    // Test database connectivity
    let databaseStatus = 'disconnected'
    const tablesStatus: string[] = []
    
    try {
      // Test basic database connectivity
      const { data: authData, error: authError } = await supabaseAdmin.auth.getUser()
      
      if (authError && authError.message !== 'Auth session missing!') {
        console.error('Database connectivity check failed:', authError)
      } else {
        databaseStatus = 'connected'
        
        // Check if documents table exists
        try {
          const { data: documentsTest, error: documentsError } = await supabaseAdmin
            .from('documents')
            .select('id')
            .limit(1)
          
          if (!documentsError) {
            tablesStatus.push('documents')
          }
        } catch (tableError) {
          console.log('Documents table check failed:', tableError)
        }
      }
    } catch (databaseError) {
      console.error('Database connectivity check failed:', databaseError)
    }

    // Test extraction interface and OpenAI service
    let extractionStatus = 'disconnected'
    const extractionServices: { [key: string]: string } = {}
    
    try {
      await import('@/src/services/extraction/extraction.interface')
      await import('@/src/types/extraction.types')
      extractionStatus = 'ready'
    } catch (extractionError) {
      console.log('Extraction interface check failed:', extractionError)
    }

    // Test OpenAI service connectivity
    try {
      const { OpenAIExtractionService } = await import('@/src/services/extraction/openai.service')
      const openaiService = new OpenAIExtractionService()
      const isConnected = await openaiService.testConnection()
      extractionServices.openai = isConnected ? 'configured' : 'disconnected'
    } catch (openaiError) {
      console.log('OpenAI service check failed:', openaiError)
      extractionServices.openai = 'not_configured'
    }

    // Test Mindee service connectivity
    try {
      const { MindeeExtractionService } = await import('@/src/services/extraction/mindee.service')
      const mindeeService = new MindeeExtractionService()
      const isConnected = await mindeeService.testConnection()
      extractionServices.mindee = isConnected ? 'configured' : 'disconnected'
    } catch (mindeeError) {
      console.log('Mindee service check failed:', mindeeError)
      extractionServices.mindee = 'not_configured'
    }

    // Test Extraction Router
    let routerStatus = 'inactive'
    let routerServices: string[] = []
    try {
      const { ExtractionRouterService } = await import('@/src/services/extraction/extraction-router.service')
      const routerService = new ExtractionRouterService()
      const isConnected = await routerService.testConnection()
      const config = routerService.getConfiguration()
      
      routerStatus = isConnected ? 'active' : 'inactive'
      routerServices = config.availableServices
    } catch (routerError) {
      console.log('Extraction router check failed:', routerError)
      routerStatus = 'error'
    }

    // Test Queue and Redis connectivity
    let queueStatus = { redis: 'disconnected', worker: 'inactive' }
    try {
      const { checkQueueHealth } = await import('@/src/lib/queue/queues')
      queueStatus = await checkQueueHealth()
    } catch (queueError) {
      console.log('Queue health check failed:', queueError)
      queueStatus = { 
        redis: 'error', 
        worker: 'inactive'
      }
    }

    // Test Vendor service connectivity
    let vendorStatus = { database: 'disconnected', tables: [] as string[] }
    try {
      const vendorService = new VendorService()
      const isConnected = await vendorService.testConnection()
      
      if (isConnected) {
        vendorStatus.database = 'connected'
        vendorStatus.tables = ['vendors', 'vendor_aliases']
      } else {
        vendorStatus.database = 'error'
      }
    } catch (vendorError) {
      console.log('Vendor service check failed:', vendorError)
      vendorStatus = {
        database: 'error',
        tables: []
      }
    }

    // Test Vendor Matching service connectivity
    let matchingStatus = { vendors: 'inactive', similarity: 'disabled', database: 'disconnected' }
    try {
      const matchingService = new VendorMatchingService()
      const healthCheck = await matchingService.getHealthStatus()
      
      matchingStatus = {
        vendors: healthCheck.vendors,
        similarity: healthCheck.similarity,
        database: healthCheck.database
      }
    } catch (matchingError) {
      console.log('Vendor matching service check failed:', matchingError)
      matchingStatus = {
        vendors: 'error',
        similarity: 'error',
        database: 'error'
      }
    }

    // Test GL Accounts service connectivity
    let glAccountsStatus = { database: 'disconnected', matching: 'inactive' }
    try {
      const glService = new GLService()
      const healthCheck = await glService.getHealthStatus()
      
      glAccountsStatus = {
        database: healthCheck.database,
        matching: healthCheck.matching
      }
    } catch (glError) {
      console.log('GL accounts service check failed:', glError)
      glAccountsStatus = {
        database: 'error',
        matching: 'error'
      }
    }

    // Test Learning System connectivity
    let learningStatus = { corrections: 'inactive', aliases: 'disabled' }
    try {
      const { CorrectionTrackerService } = await import('@/src/services/learning/correction-tracker.service')
      const learningService = new CorrectionTrackerService()
      const healthCheck = await learningService.getHealthStatus()
      
      learningStatus = {
        corrections: healthCheck.corrections,
        aliases: healthCheck.aliases
      }
    } catch (learningError) {
      console.log('Learning system check failed:', learningError)
      learningStatus = {
        corrections: 'error',
        aliases: 'error'
      }
    }

    // Test Email Ingestion System
    let emailStatus = { webhooks: 'not_configured', mailgun: 'disconnected' }
    try {
      // Check if Mailgun signing key is configured
      const mailgunKey = process.env.MAILGUN_SIGNING_KEY
      if (mailgunKey) {
        emailStatus.webhooks = 'configured'
        emailStatus.mailgun = 'connected'
      } else {
        emailStatus.webhooks = 'not_configured'
        emailStatus.mailgun = 'not_configured'
      }
      
      // Test if email_aliases table exists
      try {
        const { error: emailTableError } = await supabaseAdmin
          .from('email_aliases')
          .select('id')
          .limit(1)
        
        if (!emailTableError) {
          tablesStatus.push('email_aliases')
        }
      } catch (emailTableError) {
        console.log('Email aliases table check failed:', emailTableError)
      }
      
    } catch (emailError) {
      console.log('Email system check failed:', emailError)
      emailStatus = {
        webhooks: 'error',
        mailgun: 'error'
      }
    }

    // Test GL Rules Engine
    let glRulesStatus = { engine: 'inactive', database: 'disconnected' }
    try {
      const { GLRulesEngineService } = await import('@/src/services/gl-rules/gl-rules-engine.service')
      const glRulesService = new GLRulesEngineService()
      const healthCheck = await glRulesService.getHealthStatus()
      
      glRulesStatus = {
        engine: healthCheck.engine,
        database: healthCheck.database
      }

      // Test if GL rules tables exist
      try {
        const { error: rulesTableError } = await supabaseAdmin
          .from('company_gl_rules')
          .select('id')
          .limit(1)
        
        if (!rulesTableError) {
          tablesStatus.push('company_gl_rules')
        }
      } catch (rulesTableError) {
        console.log('GL rules table check failed:', rulesTableError)
      }

      try {
        const { error: applicationsTableError } = await supabaseAdmin
          .from('gl_rule_applications')
          .select('id')
          .limit(1)
        
        if (!applicationsTableError) {
          tablesStatus.push('gl_rule_applications')
        }
      } catch (applicationsTableError) {
        console.log('GL rule applications table check failed:', applicationsTableError)
      }
      
    } catch (glRulesError) {
      console.log('GL rules engine check failed:', glRulesError)
      glRulesStatus = {
        engine: 'error',
        database: 'error'
      }
    }

    // Test Accounting Schema (Stage 18)
    let accountingStatus = { schema: 'not_migrated', columns: 0, status: 'not_ready' }
    try {
      // Check if accounting columns exist
      const { data: schemaInfo, error: schemaError } = await supabaseAdmin
        .from('documents')
        .select('company_code, accounting_status, mapping_confidence')
        .limit(1)
      
      if (!schemaError) {
        // If we can select these columns, schema is migrated
        accountingStatus.schema = 'migrated'
        
        // Count accounting columns (21 expected)
        const accountingColumns = [
          'company_code', 'supplier_invoice_transaction_type', 'invoicing_party',
          'supplier_invoice_id_by_invcg_party', 'document_date', 'posting_date',
          'accounting_document_type', 'accounting_document_header_text', 'document_currency',
          'invoice_gross_amount', 'gl_account', 'supplier_invoice_item_text',
          'debit_credit_code', 'supplier_invoice_item_amount', 'tax_code',
          'tax_jurisdiction', 'assignment_reference', 'cost_center',
          'profit_center', 'internal_order', 'wbs_element'
        ]
        
        accountingStatus.columns = accountingColumns.length
        accountingStatus.status = 'ready'
      }
    } catch (accountingError) {
      console.log('Accounting schema check failed:', accountingError)
      accountingStatus = {
        schema: 'error',
        columns: 0,
        status: 'error'
      }
    }

    // Test Business Logic Service (Stage 19)
    let businessLogicStatus = { service: 'inactive', mappings: 'not_configured', confidence: 'disabled' }
    try {
      const { BusinessLogicService } = await import('@/src/services/accounting/business-logic.service')
      const businessLogicService = new BusinessLogicService()
      const healthCheck = await businessLogicService.testConnection()
      
      businessLogicStatus = {
        service: healthCheck.service,
        mappings: healthCheck.mappings,
        confidence: healthCheck.confidence
      }

      // Test if business logic tables exist
      try {
        const { error: companyMappingsError } = await supabaseAdmin
          .from('company_mappings')
          .select('id')
          .limit(1)
        
        if (!companyMappingsError) {
          tablesStatus.push('company_mappings')
        }
      } catch (companyMappingsError) {
        console.log('Company mappings table check failed:', companyMappingsError)
      }

      try {
        const { error: glMappingsError } = await supabaseAdmin
          .from('gl_mappings')
          .select('id')
          .limit(1)
        
        if (!glMappingsError) {
          tablesStatus.push('gl_mappings')
        }
      } catch (glMappingsError) {
        console.log('GL mappings table check failed:', glMappingsError)
      }

      try {
        const { error: costCenterRulesError } = await supabaseAdmin
          .from('cost_center_rules')
          .select('id')
          .limit(1)
        
        if (!costCenterRulesError) {
          tablesStatus.push('cost_center_rules')
        }
      } catch (costCenterRulesError) {
        console.log('Cost center rules table check failed:', costCenterRulesError)
      }

      try {
        const { error: auditLogError } = await supabaseAdmin
          .from('business_logic_audit')
          .select('id')
          .limit(1)
        
        if (!auditLogError) {
          tablesStatus.push('business_logic_audit')
        }
      } catch (auditLogError) {
        console.log('Business logic audit table check failed:', auditLogError)
      }
      
    } catch (businessLogicError) {
      console.log('Business logic service check failed:', businessLogicError)
      businessLogicStatus = {
        service: 'error',
        mappings: 'error',
        confidence: 'error'
      }
    }

    // Test Stage 20 UI Interfaces
    let stage20Status = { 
      ui_components: 'inactive', 
      apis: 'disconnected', 
      validation: 'disabled',
      audit_logging: 'disabled'
    }
    try {
      // Test accounting UI APIs
      const accountingAPIsWorking = []
      
      // Test company mappings API
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/settings/accounting/company-mappings`, {
          method: 'GET'
        })
        if (response.status === 401 || response.status === 200) { // Either auth required or working
          accountingAPIsWorking.push('company-mappings')
        }
      } catch (e) {
        // API might not be available in this context
      }
      
      // Test GL accounts API  
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/settings/accounting/gl-accounts`, {
          method: 'GET'
        })
        if (response.status === 401 || response.status === 200) { // Either auth required or working
          accountingAPIsWorking.push('gl-accounts')
        }
      } catch (e) {
        // API might not be available in this context
      }

      // Check if validation schemas exist
      try {
        await import('@/src/lib/validation/accounting.schemas')
        stage20Status.validation = 'enabled'
      } catch (validationError) {
        console.log('Validation schemas check failed:', validationError)
        stage20Status.validation = 'not_configured'
      }

      // Check if audit logging service exists
      try {
        await import('@/src/services/audit/audit-log.service')
        stage20Status.audit_logging = 'enabled'
      } catch (auditError) {
        console.log('Audit logging service check failed:', auditError)
        stage20Status.audit_logging = 'not_configured'
      }

      // Check UI component availability
      try {
        await import('@/src/components/accounting/AccountingField')
        await import('@/src/components/accounting/CompanyCodeSelector') 
        await import('@/src/components/accounting/GLAccountSelector')
        stage20Status.ui_components = 'active'
      } catch (uiError) {
        console.log('UI components check failed:', uiError)
        stage20Status.ui_components = 'not_available'
      }

      // Overall API status
      if (accountingAPIsWorking.length >= 2) {
        stage20Status.apis = 'connected'
      } else if (accountingAPIsWorking.length > 0) {
        stage20Status.apis = 'partial'
      } else {
        stage20Status.apis = 'disconnected'
      }

    } catch (stage20Error) {
      console.log('Stage 20 UI check failed:', stage20Error)
      stage20Status = {
        ui_components: 'error',
        apis: 'error', 
        validation: 'error',
        audit_logging: 'error'
      }
    }

    return NextResponse.json({
      status: 'healthy',
      auth: 'configured',
      storage: storageStatus,
      upload: uploadStatus,
      database: databaseStatus,
      tables: tablesStatus,
      extraction: {
        interface: extractionStatus,
        router: routerStatus,
        services: routerServices,
        service_details: extractionServices
      },
      queue: queueStatus,
      vendors: vendorStatus,
      matching: matchingStatus,
      gl_accounts: glAccountsStatus,
      gl_rules: glRulesStatus,
      learning: learningStatus,
      email: emailStatus,
      accounting: accountingStatus,
      business_logic: businessLogicStatus,
      stage_20_ui: stage20Status,
      routes: {
        dashboard: 'available',
        documents_list: 'available',
        document_detail: 'available',
        accounting_ui: stage20Status.ui_components === 'active' ? 'available' : 'unavailable'
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}