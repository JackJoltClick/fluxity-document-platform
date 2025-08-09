'use client'

import { useState } from 'react'
import { ExcelExportService, ExcelExportOptions } from '@/src/lib/excel-export'
import { useAuthStore } from '@/src/stores/auth.store'
import { supabase } from '@/src/lib/supabase/client'
import { 
  DocumentArrowDownIcon, 
  Cog6ToothIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

interface ClientSchema {
  id: string
  name: string
  description: string | null
  columns: { name: string; description: string }[]
}

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

interface ExcelExportButtonProps {
  documents?: DocumentWithAccounting[]
  document?: DocumentWithAccounting
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: Error) => void
}

export function ExcelExportButton({
  documents,
  document,
  variant = 'outline',
  size = 'md',
  className = '',
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError
}: ExcelExportButtonProps) {
  const [exporting, setExporting] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExcelExportOptions>({
    includeMetadata: true,
    includeConfidenceScores: false,
    dateFormat: 'locale'
  })
  const { user } = useAuthStore()

  // Determine what we're exporting
  const exportDocuments = documents || (document ? [document] : [])
  const isSingleDocument = exportDocuments.length === 1
  const isMultipleDocuments = exportDocuments.length > 1

  const handleExport = async (options?: ExcelExportOptions) => {
    if (!user || exportDocuments.length === 0) return

    try {
      setExporting(true)
      onExportStart?.()

      // Fetch client schemas for dynamic documents
      const schemaIds = Array.from(new Set(
        exportDocuments
          .map(doc => doc.client_schema_id)
          .filter(id => id !== null && id !== undefined)
      )) as string[]

      let clientSchemas: ClientSchema[] = []
      if (schemaIds.length > 0) {
        const { data, error } = await supabase
          .from('client_schemas')
          .select('id, name, description, columns')
          .in('id', schemaIds)

        if (error) {
          console.error('Error fetching client schemas:', error)
        } else {
          clientSchemas = data || []
        }
      }

      // Perform export
      if (isSingleDocument) {
        const schema = clientSchemas.find(s => s.id === exportDocuments[0].client_schema_id)
        await ExcelExportService.exportSingleDocument(
          exportDocuments[0],
          schema,
          options || exportOptions
        )
      } else {
        await ExcelExportService.exportDocuments(
          exportDocuments,
          clientSchemas,
          options || exportOptions
        )
      }

      onExportComplete?.()
    } catch (error) {
      console.error('Excel export failed:', error)
      onExportError?.(error as Error)
    } finally {
      setExporting(false)
    }
  }

  const getButtonText = () => {
    if (exporting) return 'Exporting...'
    if (isSingleDocument) return 'Export to Excel'
    if (isMultipleDocuments) return `Export ${exportDocuments.length} Documents`
    return 'Export to Excel'
  }

  const getButtonClasses = () => {
    const baseClasses = 'inline-flex items-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors'
    
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    }
    
    const variantClasses = {
      primary: 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
      secondary: 'text-white bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-300',
      outline: 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400'
    }
    
    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`
  }

  if (exportDocuments.length === 0) {
    return null
  }

  return (
    <div className="relative inline-flex">
      {/* Main Export Button */}
      <button
        onClick={() => handleExport()}
        disabled={disabled || exporting}
        className={getButtonClasses()}
        title={`Export ${isSingleDocument ? 'document' : `${exportDocuments.length} documents`} to Excel`}
      >
        <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
        {getButtonText()}
      </button>

      {/* Options Toggle Button */}
      <button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || exporting}
        className={`ml-1 ${getButtonClasses().replace('rounded-md', 'rounded-l-none rounded-r-md')} border-l border-gray-400`}
        title="Export options"
      >
        <Cog6ToothIcon className="w-4 h-4" />
      </button>

      {/* Options Dropdown */}
      {showOptions && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Export Options</h3>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeMetadata"
                  checked={exportOptions.includeMetadata}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeMetadata: e.target.checked 
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includeMetadata" className="ml-2 text-sm text-gray-700">
                  Include summary sheet
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeConfidence"
                  checked={exportOptions.includeConfidenceScores}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    includeConfidenceScores: e.target.checked 
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="includeConfidence" className="ml-2 text-sm text-gray-700">
                  Include AI confidence scores
                </label>
              </div>
              
              <div>
                <label htmlFor="dateFormat" className="block text-sm text-gray-700 mb-1">
                  Date Format
                </label>
                <select
                  id="dateFormat"
                  value={exportOptions.dateFormat}
                  onChange={(e) => setExportOptions(prev => ({ 
                    ...prev, 
                    dateFormat: e.target.value as 'iso' | 'locale' | 'short'
                  }))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="locale">Local format (12/31/2023, 3:45 PM)</option>
                  <option value="short">Short format (12/31/2023)</option>
                  <option value="iso">ISO format (2023-12-31T15:45:00.000Z)</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => setShowOptions(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport(exportOptions)}
                  disabled={exporting}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <CheckIcon className="w-4 h-4 mr-1" />
                  Export with Options
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Backdrop for closing options */}
      {showOptions && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptions(false)}
        />
      )}
    </div>
  )
}