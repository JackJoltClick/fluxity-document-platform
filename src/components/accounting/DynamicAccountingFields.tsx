'use client'

import { AccountingFieldGroup } from './AccountingFieldGroup'
import { AccountingField } from './AccountingField'
import { CompanyCodeSelector } from './CompanyCodeSelector'
import { GLAccountSelector } from './GLAccountSelector'

interface ClientSchema {
  id: string
  name: string
  description: string | null
  columns: { name: string; description: string }[]
}

interface DynamicAccountingFieldsProps {
  accountingFields: any
  documentData: any
  updateAccountingField: (fieldKey: string, newValue: any) => Promise<void>
  updateFieldMutation: any
  clientSchema?: ClientSchema | null
  isUsingDynamicSchema?: boolean
  schemaLoading?: boolean
}

// Field type definition
interface FieldDefinition {
  key: string
  label: string
  required?: boolean
  component?: 'company-selector' | 'gl-selector'
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea'
  options?: Array<{ value: string; label: string }>
}

interface FieldGroup {
  title: string
  description: string
  required?: boolean
  fields: FieldDefinition[]
}

// Field definitions with metadata
const FIELD_GROUPS: Record<string, FieldGroup> = {
  company: {
    title: "Company & Invoice Information",
    description: "Basic company and invoice identification",
    required: true,
    fields: [
      { key: 'company_code', label: 'Company Code', required: true, component: 'company-selector' },
      { key: 'invoicing_party', label: 'Invoicing Party' },
      { key: 'supplier_invoice_id_by_invcg_party', label: 'Supplier Invoice ID' },
      { 
        key: 'supplier_invoice_transaction_type', 
        label: 'Transaction Type',
        type: 'select',
        options: [
          { value: 'INVOICE', label: 'Invoice' },
          { value: 'CREDIT', label: 'Credit Note' },
          { value: 'FREIGHT', label: 'Freight' },
          { value: 'MISC', label: 'Miscellaneous' }
        ]
      }
    ]
  },
  dates: {
    title: "Document & Dates",
    description: "Document metadata and important dates",
    required: true,
    fields: [
      { key: 'document_date', label: 'Document Date', type: 'date', required: true },
      { key: 'posting_date', label: 'Posting Date', type: 'date' },
      {
        key: 'accounting_document_type',
        label: 'Document Type',
        type: 'select',
        options: [
          { value: 'RE', label: 'RE - Vendor Invoice' },
          { value: 'KR', label: 'KR - Vendor Credit' },
          { value: 'KG', label: 'KG - Vendor Payment' }
        ]
      },
      { key: 'accounting_document_header_text', label: 'Document Header Text' },
      {
        key: 'document_currency',
        label: 'Currency',
        type: 'select',
        options: [
          { value: 'USD', label: 'USD - US Dollar' },
          { value: 'EUR', label: 'EUR - Euro' },
          { value: 'GBP', label: 'GBP - British Pound' },
          { value: 'CAD', label: 'CAD - Canadian Dollar' }
        ]
      }
    ]
  },
  financial: {
    title: "Financial Details",
    description: "Invoice amounts and financial information",
    required: true,
    fields: [
      { key: 'invoice_gross_amount', label: 'Invoice Gross Amount', type: 'number', required: true },
      { key: 'supplier_invoice_item_amount', label: 'Supplier Invoice Item Amount', type: 'number' },
      { key: 'supplier_invoice_item_text', label: 'Supplier Invoice Item Text' },
      { key: 'debit_credit_code', label: 'Debit/Credit Code' }
    ]
  },
  glTax: {
    title: "GL & Tax Classification",
    description: "General ledger and tax information",
    required: true,
    fields: [
      { key: 'gl_account', label: 'GL Account', required: true, component: 'gl-selector' },
      { key: 'tax_code', label: 'Tax Code' },
      { key: 'tax_jurisdiction', label: 'Tax Jurisdiction' }
    ]
  },
  costAllocation: {
    title: "Cost Allocation",
    description: "Cost center and allocation information",
    required: false,
    fields: [
      { key: 'cost_center', label: 'Cost Center' },
      { key: 'profit_center', label: 'Profit Center' },
      { key: 'assignment_reference', label: 'Assignment Reference' },
      { key: 'internal_order', label: 'Internal Order' },
      { key: 'wbs_element', label: 'WBS Element' }
    ]
  }
}

export function DynamicAccountingFields({
  accountingFields,
  documentData,
  updateAccountingField,
  updateFieldMutation,
  clientSchema,
  isUsingDynamicSchema = false,
  schemaLoading = false
}: DynamicAccountingFieldsProps) {
  // Calculate group confidence for legacy fields
  const calculateGroupConfidence = (fields: any[]) => {
    const validFields = fields.filter(field => {
      const fieldKey = typeof field === 'string' ? field : field.key
      const fieldData = accountingFields[fieldKey]
      return fieldData && typeof fieldData.confidence === 'number'
    })
    
    if (validFields.length === 0) return 0.5
    
    const totalConfidence = validFields.reduce((sum, field) => {
      const fieldKey = typeof field === 'string' ? field : field.key
      return sum + (accountingFields[fieldKey]?.confidence || 0)
    }, 0)
    
    return totalConfidence / validFields.length
  }

  // Calculate confidence for dynamic schema columns
  const calculateDynamicConfidence = (columns: any[]) => {
    const validColumns = columns.filter(column => {
      const fieldData = accountingFields[column.name]
      return fieldData && typeof fieldData.confidence === 'number'
    })
    
    if (validColumns.length === 0) return 0.5
    
    const totalConfidence = validColumns.reduce((sum, column) => {
      return sum + (accountingFields[column.name]?.confidence || 0)
    }, 0)
    
    return totalConfidence / validColumns.length
  }

  // Show loading state while fetching schema
  if (schemaLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render dynamic schema fields
  if (isUsingDynamicSchema && clientSchema) {
    return (
      <div className="space-y-6">
        <AccountingFieldGroup
          title={`${clientSchema.name} Fields`}
          description={clientSchema.description || `Custom schema with ${clientSchema.columns.length} columns`}
          confidence={calculateDynamicConfidence(clientSchema.columns)}
          required={true}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clientSchema.columns.map((column, index) => {
              const fieldData = accountingFields[column.name] || { value: null, confidence: 0 }
              const value = fieldData.value !== null ? fieldData.value : null
              const confidence = fieldData.confidence || 0.5
              
              return (
                <div key={`${column.name}-${index}`} className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {column.name}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">{column.description}</p>
                    </div>
                  </div>
                  
                  <AccountingField
                    label=""
                    value={value}
                    confidence={confidence}
                    fieldKey={column.name}
                    type="text"
                    required={false}
                    onEdit={updateAccountingField}
                    isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === column.name}
                  />
                </div>
              )
            })}
          </div>
        </AccountingFieldGroup>
        
        {/* Show schema metadata */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              <span className="font-medium">Schema:</span> {clientSchema.name}
            </div>
            <div className="text-gray-500">
              {clientSchema.columns.length} columns • Dynamic mapping
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Fallback to legacy accounting fields
  return (
    <div className="space-y-6">
      {Object.entries(FIELD_GROUPS).map(([groupKey, group]) => (
        <AccountingFieldGroup
          key={groupKey}
          title={group.title}
          description={group.description}
          confidence={calculateGroupConfidence(group.fields)}
          required={group.required}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {group.fields.map((field) => {
              // Handle both nested and direct value formats
              let fieldData = accountingFields[field.key] || { value: null, confidence: 0 }
              
              // If fieldData is already an object with value/confidence, use it as is
              // If it's a direct value, wrap it in the expected format
              if (typeof fieldData !== 'object' || !('value' in fieldData)) {
                fieldData = { value: fieldData, confidence: 0.5 }
              }
              
              const documentValue = documentData[field.key]
              
              // DEBUG: Log what we're getting from Lambda
              if (field.key === 'invoicing_party') {
                console.log('🔍 DEBUG invoicing_party:', {
                  fieldKey: field.key,
                  accountingFields: accountingFields,
                  rawFieldData: accountingFields[field.key],
                  fieldData: fieldData,
                  fieldDataValue: fieldData.value,
                  fieldDataConfidence: fieldData.confidence,
                  documentValue: documentValue
                })
              }
              
              // Use document value if extraction doesn't have it
              let value = fieldData.value !== undefined ? fieldData.value : documentValue
              
              // If value is still an object (shouldn't happen but safeguard), extract its value
              if (value && typeof value === 'object' && 'value' in value) {
                value = value.value
              }
              
              const confidence = fieldData.confidence || 0.5
              
              // Special handling for selectors
              if (field.component === 'company-selector') {
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    <CompanyCodeSelector
                      value={value || ''}
                      onChange={(newValue) => updateAccountingField(field.key, newValue)}
                    />
                  </div>
                )
              }
              
              if (field.component === 'gl-selector') {
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && '*'}
                    </label>
                    <GLAccountSelector
                      value={value || ''}
                      onChange={(newValue) => updateAccountingField(field.key, newValue)}
                    />
                  </div>
                )
              }
              
              // Regular fields
              return (
                <AccountingField
                  key={field.key}
                  label={field.label}
                  value={value}
                  confidence={confidence}
                  fieldKey={field.key}
                  type={field.type}
                  options={field.options}
                  required={field.required}
                  onEdit={updateAccountingField}
                  isLoading={updateFieldMutation.isPending && updateFieldMutation.variables?.fieldKey === field.key}
                />
              )
            })}
          </div>
        </AccountingFieldGroup>
      ))}
    </div>
  )
}