import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon, DocumentTextIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { cn } from '@/src/lib/utils';

interface ExtractedDataDisplayProps {
  extractedData: any;
  onFieldMap?: (sourceKey: string, targetField: string) => void;
  className?: string;
}

// List of available accounting fields for mapping
const ACCOUNTING_FIELDS = [
  { value: 'invoicing_party', label: 'Vendor/Supplier Name' },
  { value: 'supplier_invoice_id_by_invcg_party', label: 'Invoice Number' },
  { value: 'document_date', label: 'Invoice Date' },
  { value: 'posting_date', label: 'Posting Date' },
  { value: 'invoice_gross_amount', label: 'Total Amount' },
  { value: 'supplier_invoice_item_amount', label: 'Subtotal' },
  { value: 'supplier_invoice_item_text', label: 'Item Description' },
  { value: 'document_currency', label: 'Currency' },
  { value: 'supplier_invoice_transaction_type', label: 'Transaction Type' },
  { value: 'accounting_document_type', label: 'Document Type' },
  { value: 'accounting_document_header_text', label: 'Header Text' },
  { value: 'debit_credit_code', label: 'Debit/Credit Code' },
  { value: 'assignment_reference', label: 'Reference' },
  { value: 'company_code', label: 'Company Code' },
  { value: 'gl_account', label: 'GL Account' },
  { value: 'tax_code', label: 'Tax Code' },
  { value: 'tax_jurisdiction', label: 'Tax Jurisdiction' },
  { value: 'cost_center', label: 'Cost Center' },
  { value: 'profit_center', label: 'Profit Center' },
  { value: 'internal_order', label: 'Internal Order' },
  { value: 'wbs_element', label: 'WBS Element' }
];

export function ExtractedDataDisplay({ extractedData, onFieldMap, className }: ExtractedDataDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    mapped: true,
    unmapped: true,
    raw: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Extract field mapping data
  const fieldMappings = extractedData?.field_mappings || {};
  const mappedFields = fieldMappings.mapped || {};
  const unmappedFields = fieldMappings.unmapped || {};
  const mappingDetails = fieldMappings.mappingDetails || [];
  
  // Extract raw Textract data
  const textractData = extractedData?.textract_data || {};
  const keyValuePairs = textractData.keyValuePairs || {};

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mapped Fields Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('mapped')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-medium text-gray-900">
              Mapped Fields ({Object.keys(mappedFields).filter(k => mappedFields[k] !== null).length})
            </h3>
          </div>
          {expandedSections.mapped ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.mapped && (
          <div className="px-6 pb-4">
            <div className="space-y-3">
              {Object.entries(mappedFields).map(([field, value]) => {
                if (value === null) return null;
                
                const detail = mappingDetails.find((d: any) => d.targetField === field);
                const fieldLabel = ACCOUNTING_FIELDS.find(f => f.value === field)?.label || field;
                
                return (
                  <div key={field} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">{fieldLabel}</div>
                      <div className="text-sm text-gray-900 mt-1">{value}</div>
                      {detail && (
                        <div className="text-xs text-gray-500 mt-1">
                          Source: "{detail.sourceKey}" • Confidence: {(detail.confidence * 100).toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Unmapped Fields Section */}
      {Object.keys(unmappedFields).length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => toggleSection('unmapped')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <BeakerIcon className="w-5 h-5 text-amber-600" />
              <h3 className="text-lg font-medium text-gray-900">
                Unmapped Fields ({Object.keys(unmappedFields).length})
              </h3>
            </div>
            {expandedSections.unmapped ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {expandedSections.unmapped && (
            <div className="px-6 pb-4">
              <p className="text-sm text-gray-600 mb-4">
                These fields were extracted but couldn't be automatically mapped to accounting fields.
              </p>
              <div className="space-y-3">
                {Object.entries(unmappedFields).map(([key, value]) => (
                  <div key={key} className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700">{key}</div>
                      <div className="text-sm text-gray-900 mt-1">{value}</div>
                    </div>
                    {onFieldMap && (
                      <select
                        className="ml-4 text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        defaultValue=""
                        onChange={(e) => {
                          if (e.target.value) {
                            onFieldMap(key, e.target.value);
                          }
                        }}
                      >
                        <option value="">Map to field...</option>
                        {ACCOUNTING_FIELDS.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Raw Data Section (Collapsed by default) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('raw')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">
              All Extracted Data ({Object.keys(keyValuePairs).length} fields)
            </h3>
          </div>
          {expandedSections.raw ? (
            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          )}
        </button>
        
        {expandedSections.raw && (
          <div className="px-6 pb-4">
            <div className="bg-gray-50 rounded-md p-4 overflow-x-auto">
              <pre className="text-xs text-gray-700">
                {JSON.stringify(keyValuePairs, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}