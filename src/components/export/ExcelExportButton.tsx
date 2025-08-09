'use client'

import { useState } from 'react'
import { ExcelExportService, ExcelExportOptions } from '@/src/lib/excel-export'
import { useAuthStore } from '@/src/stores/auth.store'
import { supabase } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/design-system/foundations/Button'
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

  if (exportDocuments.length === 0) {
    return null
  }

  return (
    <div className="relative inline-flex">
      {/* Main Export Button */}
      <Button
        onClick={() => handleExport()}
        disabled={disabled || exporting}
        variant={variant}
        size={size}
        loading={exporting}
        icon={<DocumentArrowDownIcon className="w-4 h-4" />}
        className={className}
        title={`Export ${isSingleDocument ? 'document' : `${exportDocuments.length} documents`} to Excel`}
      >
        {getButtonText()}
      </Button>

      {/* Options Toggle Button */}
      <Button
        onClick={() => setShowOptions(!showOptions)}
        disabled={disabled || exporting}
        variant={variant}
        size={size}
        className="ml-1 !rounded-l-none"
        title="Export options"
      >
        <Cog6ToothIcon className="w-4 h-4" />
      </Button>

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
              <Button
                onClick={() => setShowOptions(false)}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => handleExport(exportOptions)}
                  disabled={exporting}
                  variant="primary"
                  size="sm"
                  loading={exporting}
                  icon={<CheckIcon className="w-4 h-4" />}
                >
                  Export with Options
                </Button>
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