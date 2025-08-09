'use client'

import { ExcelExportButton } from './ExcelExportButton'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface DocumentWithAccounting {
  id: string
  filename: string
  created_at: string
  updated_at?: string
  client_schema_id?: string | null
  extracted_data?: any
  accounting_status?: 'needs_mapping' | 'ready_for_export' | 'exported'
  [key: string]: any
}

interface BulkExportButtonProps {
  documents: DocumentWithAccounting[]
  selectedDocumentIds?: string[]
  className?: string
}

export function BulkExportButton({ documents, selectedDocumentIds = [], className = '' }: BulkExportButtonProps) {
  // Get the selected documents from the provided IDs
  const selectedDocumentsArray = documents.filter(doc => 
    selectedDocumentIds.includes(doc.id)
  )

  // Filter documents that are ready for export (for fallback when nothing is selected)
  const readyDocuments = documents.filter(doc => 
    doc.accounting_status === 'ready_for_export' || 
    doc.accounting_status === 'exported'
  )

  const handleExportComplete = () => {
    // Export complete - no need to manage selection state
  }

  // If no documents are selected and no ready documents, show empty state
  if (selectedDocumentsArray.length === 0 && readyDocuments.length === 0) {
    return (
      <div className={`text-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <DocumentArrowDownIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">No documents are ready for export</p>
        <p className="text-xs text-gray-400 mt-1">
          Documents must be processed and marked as "ready for export"
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {selectedDocumentsArray.length > 0 ? (
        // Export selected documents
        <ExcelExportButton
          documents={selectedDocumentsArray}
          variant="primary"
          size="lg"
          className="w-full justify-center"
          onExportComplete={handleExportComplete}
        />
      ) : readyDocuments.length > 0 ? (
        // Export all ready documents as fallback
        <ExcelExportButton
          documents={readyDocuments}
          variant="outline"
          size="lg"
          className="w-full justify-center"
          onExportComplete={handleExportComplete}
        />
      ) : null}
    </div>
  )
}