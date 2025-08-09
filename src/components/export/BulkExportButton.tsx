'use client'

import { useState } from 'react'
import { ExcelExportButton } from './ExcelExportButton'
import { Button } from '@/src/components/design-system/foundations/Button'
import { 
  DocumentArrowDownIcon, 
  CheckIcon, 
  XMarkIcon
} from '@heroicons/react/24/outline'

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
  className?: string
}

export function BulkExportButton({ documents, className = '' }: BulkExportButtonProps) {
  const [showBulkSelect, setShowBulkSelect] = useState(false)
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set())

  // Filter documents that are ready for export
  const readyDocuments = documents.filter(doc => 
    doc.accounting_status === 'ready_for_export' || 
    doc.accounting_status === 'exported'
  )

  const exportableDocuments = documents.filter(doc => {
    // Documents with completed status can be exported regardless of accounting_status
    return doc.accounting_status === 'ready_for_export' || 
           doc.accounting_status === 'exported' ||
           (!doc.accounting_status && doc.extracted_data)
  })

  const selectedDocumentsArray = documents.filter(doc => 
    selectedDocuments.has(doc.id)
  )

  const handleSelectAll = () => {
    if (selectedDocuments.size === exportableDocuments.length) {
      setSelectedDocuments(new Set())
    } else {
      setSelectedDocuments(new Set(exportableDocuments.map(doc => doc.id)))
    }
  }

  const handleSelectDocument = (documentId: string) => {
    const newSelected = new Set(selectedDocuments)
    if (newSelected.has(documentId)) {
      newSelected.delete(documentId)
    } else {
      newSelected.add(documentId)
    }
    setSelectedDocuments(newSelected)
  }

  const handleExportComplete = () => {
    setShowBulkSelect(false)
    setSelectedDocuments(new Set())
  }

  if (exportableDocuments.length === 0) {
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
      {!showBulkSelect ? (
        <div className="space-y-3">
          {/* Quick Export All Ready Documents */}
          {readyDocuments.length > 0 && (
            <ExcelExportButton
              documents={readyDocuments}
              variant="primary"
              size="lg"
              className="w-full justify-center"
              onExportComplete={handleExportComplete}
            />
          )}
          
          {/* Bulk Select Option */}
          {exportableDocuments.length > readyDocuments.length && (
            <Button
              onClick={() => setShowBulkSelect(true)}
              variant="outline"
              size="lg"
              fullWidth
              icon={<CheckIcon className="w-4 h-4" />}
            >
              Select Documents to Export
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Select Documents to Export</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedDocuments.size} of {exportableDocuments.length} documents selected
              </p>
            </div>
            <Button
              onClick={() => setShowBulkSelect(false)}
              variant="ghost"
              size="sm"
            >
              <XMarkIcon className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Select All */}
          <div className="p-4 border-b border-gray-200">
            <Button
              onClick={handleSelectAll}
              variant="ghost"
              size="sm"
              icon={<CheckIcon className="w-4 h-4" />}
            >
              {selectedDocuments.size === exportableDocuments.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          {/* Document List */}
          <div className="max-h-64 overflow-y-auto">
            {exportableDocuments.map((document) => (
              <div key={document.id} className="flex items-center p-3 hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedDocuments.has(document.id)}
                  onChange={() => handleSelectDocument(document.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {document.filename}
                    </p>
                    <div className="flex items-center space-x-2">
                      {document.client_schema_id && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Dynamic Schema
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        document.accounting_status === 'ready_for_export' 
                          ? 'bg-green-100 text-green-800'
                          : document.accounting_status === 'exported'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {document.accounting_status || 'needs review'}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(document.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Export Actions */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <Button
                onClick={() => {
                  setShowBulkSelect(false)
                  setSelectedDocuments(new Set())
                }}
                variant="outline"
                size="md"
              >
                Cancel
              </Button>
              
              {selectedDocuments.size > 0 && (
                <ExcelExportButton
                  documents={selectedDocumentsArray}
                  variant="primary"
                  onExportComplete={handleExportComplete}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}