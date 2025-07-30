'use client'

import { useParams, useRouter } from 'next/navigation'
import { useDocument, useUpdateDocumentField, useReprocessDocument, useRetryDocument } from '@/src/hooks/useDocument'
import { useAuthStore } from '@/src/stores/auth.store'
import { StatusBadge, CostDisplay } from '@/src/components/StatusBadge'
import ErrorBoundary from '@/src/components/ErrorBoundary'
import VendorMatchingSection from '@/src/components/VendorMatchingSection'
import { SimpleMappingWarning } from '@/src/components/SimpleMappingWarning'
import { PageHeader } from '@/src/components/design-system/layout/PageHeader'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'
import { ErrorState } from '@/src/components/design-system/feedback/ErrorState'
import { ProcessingProgress } from '@/src/components/design-system/feedback/ProcessingProgress'

// Accounting Components
import { AccountingFieldGroup } from '@/src/components/accounting/AccountingFieldGroup'
import { AccountingField } from '@/src/components/accounting/AccountingField'
import { AccountingStatusBadge } from '@/src/components/accounting/AccountingStatusBadge'
import { ConfidenceIndicator } from '@/src/components/accounting/ConfidenceIndicator'
import { CompanyCodeSelector } from '@/src/components/accounting/CompanyCodeSelector'
import { GLAccountSelector } from '@/src/components/accounting/GLAccountSelector'
import { JustificationReport } from '@/src/components/JustificationReport'

import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/outline'

function DocumentDetailsContent() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const documentId = params.id as string

  // React Query hooks
  const { data: document, isLoading, error, refetch } = useDocument(documentId)
  const updateFieldMutation = useUpdateDocumentField()
  const reprocessMutation = useReprocessDocument()
  const retryMutation = useRetryDocument()

  // Update accounting field using React Query
  const updateAccountingField = async (fieldKey: string, newValue: string | number | boolean) => {
    try {
      await updateFieldMutation.mutateAsync({
        documentId,
        fieldKey,
        newValue
      })
    } catch (error) {
      console.error('Error updating field:', error)
      throw error // Re-throw so the component can handle it
    }
  }

  // Mark as ready for export
  const markReadyForExport = async () => {
    console.log('🔄 BUTTON CLICKED: Marking document as ready for export...')
    console.log('📊 BEFORE UPDATE - Current document state:', {
      accounting_status: document?.accounting_status,
      requires_review: document?.requires_review
    })
    
    try {
      const result = await updateFieldMutation.mutateAsync({
        documentId,
        updates: {
          requires_review: false,
          accounting_status: 'ready_for_export'
        }
      })
      
      console.log('✅ UPDATE SUCCESS - API returned:', result)
      console.log('📊 AFTER UPDATE - Document should be:', {
        accounting_status: 'ready_for_export',
        requires_review: false
      })
      
    } catch (error) {
      console.error('❌ UPDATE FAILED:', error)
    }
  }

  // Mark as requires review
  const markRequiresReview = async () => {
    console.log('🔄 Marking document as requires review...')
    try {
      await updateAccountingField('requires_review', true)
      console.log('✅ Document marked as requires review')
    } catch (error) {
      console.error('❌ Failed to mark as requires review:', error)
    }
  }

  // Re-process all accounting fields
  const reprocessAllFields = () => {
    console.log('🔄 Starting reprocess for document:', documentId)
    reprocessMutation.mutate(documentId, {
      onSuccess: (data) => {
        console.log('✅ Reprocess completed successfully:', data)
      },
      onError: (error) => {
        console.error('❌ Reprocess failed:', error)
      }
    })
  }

  // Retry failed document processing
  const retryProcessing = () => {
    retryMutation.mutate(documentId)
  }

  // Calculate overall confidence for accounting fields
  const calculateOverallConfidence = () => {
    if (!document || !document.extracted_data) return 0
    
    // Use the mapping_confidence if available (set by Stage 19)
    if (document.mapping_confidence !== undefined) {
      return document.mapping_confidence
    }
    
    // Fallback: calculate from individual field confidences
    const extractedData = document.extracted_data as any
    const fields = Object.keys(extractedData).filter(key => 
      typeof extractedData[key] === 'object' && 
      'confidence' in extractedData[key]
    )
    
    if (fields.length === 0) return 0
    
    const totalConfidence = fields.reduce((sum, key) => {
      return sum + (extractedData[key].confidence || 0)
    }, 0)
    
    return totalConfidence / fields.length
  }

  // Get field confidence from extracted data
  const getFieldConfidence = (fieldKey: string): number => {
    if (!document?.extracted_data) return 0
    const extractedData = document.extracted_data as any
    return extractedData[fieldKey]?.confidence || 0.5
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Details"
          breadcrumb={{
            label: 'Back to Documents',
            href: '/documents'
          }}
        />
        
        <LoadingState
          variant="spinner"
          size="lg"
          message="Loading document..."
          centered
        >
          <p className="text-base text-gray-500 font-light">
            Fetching document and accounting details
          </p>
        </LoadingState>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Details"
          breadcrumb={{
            label: 'Back to Documents',
            href: '/documents'
          }}
        />
        
        <ErrorState
          title="Failed to load document"
          message={error.message}
          primaryAction={{
            label: 'Try Again',
            onClick: () => refetch()
          }}
        />
      </div>
    )
  }

  if (!document) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Details"
          breadcrumb={{
            label: 'Back to Documents',
            href: '/documents'
          }}
        />
        
        <ErrorState
          title="Document not found"
          message="The document you're looking for doesn't exist or you don't have access to it."
          variant="warning"
        />
      </div>
    )
  }

  const overallConfidence = calculateOverallConfidence()
  const isAccountingReady = document.accounting_status === 'ready_for_export'
  const needsReview = document.requires_review

  // Debug logging for UI state changes
  console.log('🎯 UI State Debug:', {
    documentId: document.id,
    accounting_status: document.accounting_status,
    requires_review: document.requires_review,
    isAccountingReady,
    needsReview,
    overallConfidence
  })

  return (
    <div className="space-y-8">
      <PageHeader
        title={document.filename}
        breadcrumb={{
          label: 'Back to Documents',
          href: '/documents'
        }}
        primaryAction={{
          label: 'View File',
          href: document.file_url
        }}
        actions={
          <div className="flex items-center space-x-4">
            <StatusBadge status={document.status} />
            {document.accounting_status && (
              <AccountingStatusBadge status={document.accounting_status} />
            )}
            <CostDisplay 
              cost={document.extraction_cost ?? null} 
              method={document.extraction_method ?? null}
              className="text-sm"
            />
            <span className="text-xs text-gray-400">
              Updated: {new Date(document.updated_at || document.created_at).toLocaleTimeString()}
            </span>
          </div>
        }
      />

      {/* Simple Mapping Mode Warning - Context aware */}
      <SimpleMappingWarning context="accounting" dismissible={true} />

      {/* Processing Progress */}
      {(document.status === 'pending' || document.status === 'processing') && (
        <ProcessingProgress
          status={document.status as 'pending' | 'processing'}
          progress={document.status === 'pending' ? 5 : 50}
        />
      )}

      {/* Error State with Retry */}
      {document.status === 'failed' && (
        <ProcessingProgress
          status="failed"
          progress={100}
          infoText={document.error_message || undefined}
          onRetry={retryProcessing}
          retrying={retryMutation.isPending}
        />
      )}

      {/* Accounting Overview */}
      {document.status === 'completed' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-gray-900 tracking-tight">Accounting Status</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {isAccountingReady 
                    ? 'This document is ready for export to your accounting system'
                    : needsReview
                    ? 'This document requires review before export'
                    : 'Accounting fields are being processed'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <ConfidenceIndicator 
                  confidence={overallConfidence} 
                  variant="bar"
                  className="w-48"
                />
              </div>
            </div>
            
            {/* Context-specific warning for high confidence scores */}
            {overallConfidence > 0.8 && (
              <div className="mt-4">
                <SimpleMappingWarning context="confidence" dismissible={true} className="text-sm" />
              </div>
            )}
          </div>
          
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="mt-1">
                    {document.accounting_status ? (
                      <AccountingStatusBadge status={document.accounting_status} />
                    ) : (
                      <span className="text-sm text-gray-500">Processing...</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Overall Confidence</div>
                  <div className="mt-1">
                    <ConfidenceIndicator confidence={overallConfidence} variant="badge" />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Requires Review</div>
                  <div className="mt-1">
                    {needsReview ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <ExclamationTriangleIcon className="w-3 h-3 mr-1" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        No
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={reprocessAllFields}
                  disabled={reprocessMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ArrowPathIcon className={`w-4 h-4 mr-2 ${reprocessMutation.isPending ? 'animate-spin' : ''}`} />
                  Re-process All
                </button>
                
                {!isAccountingReady && (
                  <button
                    onClick={markReadyForExport}
                    disabled={updateFieldMutation.isPending}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Mark Ready for Export
                  </button>
                )}
                
                <button
                  onClick={markRequiresReview}
                  disabled={updateFieldMutation.isPending}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
                  Requires Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Two-Column Layout: Document Preview + Accounting Fields */}
      {document.status === 'completed' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Document Preview - Left 40% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Info */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  Document Preview
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Filename</dt>
                    <dd className="text-sm text-gray-900 font-medium">{document.filename}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">Source</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                        document.source === 'email' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {document.source === 'email' ? '📧 Email' : '📤 Upload'}
                      </span>
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-600">
                      {document.source === 'email' ? 'Received' : 'Uploaded'}
                    </dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(document.created_at).toLocaleString()}
                    </dd>
                  </div>
                  {document.extraction_method && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">Extraction Method</dt>
                      <dd className="text-sm text-gray-900">{document.extraction_method}</dd>
                    </div>
                  )}
                </div>
                
                <div className="mt-6">
                  <a
                    href={document.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <DocumentTextIcon className="w-4 h-4 mr-2" />
                    View Original Document
                  </a>
                </div>
              </div>
            </div>

            {/* Vendor Matching Section */}
            {document.extracted_data && (
              <VendorMatchingSection 
                documentId={documentId}
                supplierName={document.extracted_data.supplier_name?.value as string}
                onMatchConfirmed={(match) => {
                  console.log('Vendor match confirmed:', match)
                }}
              />
            )}

            {/* AI Justification Report */}
            {document.extracted_data && (
              <JustificationReport
                report={(document.extracted_data as any).justification_report}
                documentMetadata={(document.extracted_data as any).document_metadata}
                validationFlags={(document.extracted_data as any).validation_flags}
              />
            )}
          </div>

          {/* Accounting Fields - Right 60% */}
          <div className="lg:col-span-3 space-y-6">
            {/* Company & Invoice Information */}
            <AccountingFieldGroup 
              title="Company & Invoice Information"
              description="Basic company and invoice identification"
              confidence={0.8}
              required
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Code *
                  </label>
                  <CompanyCodeSelector
                    value={document.company_code ?? ''}
                    onChange={(value) => updateAccountingField('company_code', value)}
                  />
                </div>
                
                <AccountingField
                  label="Invoicing Party"
                  value={document.invoicing_party ?? null}
                  confidence={getFieldConfidence('supplier_name')}
                  fieldKey="invoicing_party"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'invoicing_party'}
                />
                
                <AccountingField
                  label="Supplier Invoice ID"
                  value={document.supplier_invoice_id_by_invcg_party ?? null}
                  confidence={getFieldConfidence('invoice_number')}
                  fieldKey="supplier_invoice_id_by_invcg_party"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'supplier_invoice_id_by_invcg_party'}
                />
                
                <AccountingField
                  label="Transaction Type"
                  value={document.supplier_invoice_transaction_type ?? null}
                  confidence={0.9}
                  fieldKey="supplier_invoice_transaction_type"
                  type="select"
                  options={[
                    { value: 'INVOICE', label: 'Invoice' },
                    { value: 'CREDIT', label: 'Credit Note' },
                    { value: 'FREIGHT', label: 'Freight' },
                    { value: 'MISC', label: 'Miscellaneous' }
                  ]}
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'supplier_invoice_transaction_type'}
                />
              </div>
            </AccountingFieldGroup>

            {/* Document & Dates */}
            <AccountingFieldGroup 
              title="Document & Dates"
              description="Document metadata and important dates"
              confidence={0.7}
              required
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AccountingField
                  label="Document Date"
                  value={document.document_date ?? null}
                  confidence={getFieldConfidence('invoice_date')}
                  fieldKey="document_date"
                  type="date"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'document_date'}
                  required
                />
                
                <AccountingField
                  label="Posting Date"
                  value={document.posting_date ?? null}
                  confidence={0.8}
                  fieldKey="posting_date"
                  type="date"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'posting_date'}
                />
                
                <AccountingField
                  label="Document Type"
                  value={document.accounting_document_type ?? null}
                  confidence={0.9}
                  fieldKey="accounting_document_type"
                  type="select"
                  options={[
                    { value: 'RE', label: 'RE - Vendor Invoice' },
                    { value: 'KR', label: 'KR - Vendor Credit' },
                    { value: 'KG', label: 'KG - Vendor Payment' }
                  ]}
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'accounting_document_type'}
                />
                
                <AccountingField
                  label="Document Header Text"
                  value={document.accounting_document_header_text ?? null}
                  confidence={0.6}
                  fieldKey="accounting_document_header_text"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'accounting_document_header_text'}
                />
                
                <AccountingField
                  label="Currency"
                  value={document.document_currency ?? null}
                  confidence={getFieldConfidence('currency') || 0.8}
                  fieldKey="document_currency"
                  type="select"
                  options={[
                    { value: 'USD', label: 'USD - US Dollar' },
                    { value: 'EUR', label: 'EUR - Euro' },
                    { value: 'GBP', label: 'GBP - British Pound' },
                    { value: 'CAD', label: 'CAD - Canadian Dollar' }
                  ]}
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'document_currency'}
                />
              </div>
            </AccountingFieldGroup>

            {/* Financial Details */}
            <AccountingFieldGroup 
              title="Financial Details"
              description="Invoice amounts and financial information"
              confidence={0.85}
              required
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AccountingField
                  label="Invoice Gross Amount"
                  value={document.invoice_gross_amount ?? null}
                  confidence={getFieldConfidence('total_amount')}
                  fieldKey="invoice_gross_amount"
                  type="number"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'invoice_gross_amount'}
                  required
                />
                
                <AccountingField
                  label="Supplier Invoice Item Amount"
                  value={document.supplier_invoice_item_amount ?? null}
                  confidence={getFieldConfidence('total_amount')}
                  fieldKey="supplier_invoice_item_amount"
                  type="number"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'supplier_invoice_item_amount'}
                />
                
                <div className="md:col-span-2">
                  <AccountingField
                    label="Supplier Invoice Item Text"
                    value={document.supplier_invoice_item_text ?? null}
                    confidence={getFieldConfidence('line_items')}
                    fieldKey="supplier_invoice_item_text"
                    type="textarea"
                    onEdit={updateAccountingField}
                    isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'supplier_invoice_item_text'}
                  />
                </div>
                
                <AccountingField
                  label="Debit/Credit Code"
                  value={document.debit_credit_code ?? null}
                  confidence={0.9}
                  fieldKey="debit_credit_code"
                  type="select"
                  options={[
                    { value: 'D', label: 'D - Debit' },
                    { value: 'C', label: 'C - Credit' }
                  ]}
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'debit_credit_code'}
                />
              </div>
            </AccountingFieldGroup>

            {/* GL & Tax Classification */}
            <AccountingFieldGroup 
              title="GL & Tax Classification"
              description="General ledger and tax information"
              confidence={0.75}
              required
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GL Account *
                  </label>
                  <GLAccountSelector
                    value={document.gl_account ?? ''}
                    onChange={(value) => updateAccountingField('gl_account', value)}
                  />
                </div>
                
                <AccountingField
                  label="Tax Code"
                  value={document.tax_code ?? null}
                  confidence={0.6}
                  fieldKey="tax_code"
                  type="select"
                  options={[
                    { value: 'V0', label: 'V0 - Tax Free' },
                    { value: 'V1', label: 'V1 - Standard Tax' },
                    { value: 'V2', label: 'V2 - Reduced Tax' },
                    { value: 'V3', label: 'V3 - Zero Tax' }
                  ]}
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'tax_code'}
                />
                
                <AccountingField
                  label="Tax Jurisdiction"
                  value={document.tax_jurisdiction ?? null}
                  confidence={0.5}
                  fieldKey="tax_jurisdiction"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'tax_jurisdiction'}
                />
              </div>
            </AccountingFieldGroup>

            {/* Cost Allocation */}
            <AccountingFieldGroup 
              title="Cost Allocation"
              description="Cost center and allocation information"
              confidence={0.6}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AccountingField
                  label="Cost Center"
                  value={document.cost_center ?? null}
                  confidence={0.7}
                  fieldKey="cost_center"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'cost_center'}
                />
                
                <AccountingField
                  label="Profit Center"
                  value={document.profit_center ?? null}
                  confidence={0.5}
                  fieldKey="profit_center"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'profit_center'}
                />
                
                <AccountingField
                  label="Assignment Reference"
                  value={document.assignment_reference ?? null}
                  confidence={0.4}
                  fieldKey="assignment_reference"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'assignment_reference'}
                />
                
                <AccountingField
                  label="Internal Order"
                  value={document.internal_order ?? null}
                  confidence={0.3}
                  fieldKey="internal_order"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'internal_order'}
                />
                
                <AccountingField
                  label="WBS Element"
                  value={document.wbs_element ?? null}
                  confidence={0.3}
                  fieldKey="wbs_element"
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === 'wbs_element'}
                />
              </div>
            </AccountingFieldGroup>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DocumentDetailsPage() {
  return (
    <ErrorBoundary>
      <DocumentDetailsContent />
    </ErrorBoundary>
  )
}