'use client'

import { AccountingFieldGroup } from './AccountingFieldGroup'
import { AccountingField } from './AccountingField'
import { CompanyCodeSelector } from './CompanyCodeSelector'
import { GLAccountSelector } from './GLAccountSelector'

interface DynamicAccountingFieldsProps {
  accountingFields: any
  documentData: any
  updateAccountingField: (fieldKey: string, newValue: any) => Promise<void>
  updateFieldMutation: any
}

// Field type definition
interface FieldDefinition {
  key: string
  label: string
  required?: boolean
  component?: 'company-selector' | 'gl-selector'
  type?: 'date' | 'select' | 'number' | 'textarea'
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
  updateFieldMutation
}: DynamicAccountingFieldsProps) {
  // Calculate group confidence
  const calculateGroupConfidence = (fields: any[]) => {
    const validFields = fields.filter(field => {
      const fieldData = accountingFields[field.key]
      return fieldData && typeof fieldData.confidence === 'number'
    })
    
    if (validFields.length === 0) return 0.5
    
    const totalConfidence = validFields.reduce((sum, field) => {
      return sum + (accountingFields[field.key]?.confidence || 0)
    }, 0)
    
    return totalConfidence / validFields.length
  }

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
              const fieldData = accountingFields[field.key] || { value: null, confidence: 0 }
              const documentValue = documentData[field.key]
              
              // Use document value if extraction doesn't have it
              const value = fieldData.value !== null ? fieldData.value : documentValue
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
                      supplierId={documentData.vendor_id}
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