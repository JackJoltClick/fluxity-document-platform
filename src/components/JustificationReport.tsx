'use client'

import { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface JustificationReportProps {
  report?: string | any // Can be string or parsed JSON
  documentMetadata?: any
  validationFlags?: any
  className?: string
}

export function JustificationReport({ 
  report, 
  documentMetadata, 
  validationFlags, 
  className = '' 
}: JustificationReportProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!report && !documentMetadata) {
    return null
  }

  // Parse markdown-like content to basic formatting or handle JSON
  const formatReport = (content: string | any) => {
    // If it's a string that looks like JSON, try to parse it
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(content)
        // Format the JSON into readable text
        return formatJSONReport(parsed)
      } catch (e) {
        // Not valid JSON, treat as markdown
      }
    }
    
    // If it's already an object, format it
    if (typeof content === 'object' && content !== null) {
      return formatJSONReport(content)
    }
    
    // Otherwise treat as markdown string
    if (typeof content !== 'string') return ''
    
    return content
      // Convert markdown headers to HTML-like structure
      .replace(/### (.*?)(\n|$)/g, '<h4 class="font-semibold text-gray-900 mt-4 mb-2">$1</h4>')
      .replace(/## (.*?)(\n|$)/g, '<h3 class="font-semibold text-gray-900 text-lg mt-6 mb-3">$1</h3>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // Convert bullet points
      .replace(/^- (.*?)$/gm, '<li class="ml-4">• $1</li>')
      // Convert line breaks
      .replace(/\n/g, '<br />')
  }
  
  // Format JSON justification report
  const formatJSONReport = (data: any): string => {
    let html = ''
    
    // Handle nested justification structure
    const justifications = data.justification_report || data['Field Extraction Justifications'] || data
    
    if (typeof justifications === 'object') {
      Object.entries(justifications).forEach(([key, value]: [string, any]) => {
        if (typeof value === 'object' && value !== null) {
          // Format field name
          const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          html += `<div class="mb-4 p-3 bg-gray-50 rounded-md">
            <h5 class="font-medium text-gray-900 mb-2">${fieldName}</h5>`
          
          // Format field details
          Object.entries(value).forEach(([prop, val]) => {
            if (prop !== 'Business Notes' && val !== null && val !== undefined) {
              html += `<div class="text-sm mb-1">
                <span class="text-gray-600">${prop}:</span> 
                <span class="text-gray-900">${val}</span>
              </div>`
            }
          })
          
          if (value['Business Notes']) {
            html += `<div class="text-sm mt-2 text-gray-600 italic">${value['Business Notes']}</div>`
          }
          
          html += '</div>'
        }
      })
    }
    
    return html || '<p class="text-gray-500">No extraction details available</p>'
  }

  const overallConfidence = documentMetadata?.overall_confidence || 0
  const hasValidationFlags = validationFlags && Object.keys(validationFlags).length > 0

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden ${className}`}>
      <div className="px-6 py-4 border-b border-gray-100">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded"
        >
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2" />
            AI Analysis Report
          </h3>
          <div className="flex items-center space-x-2">
            {documentMetadata?.overall_confidence && (
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                overallConfidence >= 0.8 
                  ? 'bg-green-100 text-green-800'
                  : overallConfidence >= 0.6
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {Math.round(overallConfidence * 100)}% confidence
              </span>
            )}
            {isExpanded ? (
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            )}
          </div>
        </button>
        <p className="mt-1 text-sm text-gray-500">
          Detailed AI reasoning for field extraction and mapping decisions
        </p>
      </div>
      
      {isExpanded && (
        <div className="p-6 space-y-6">
          {/* Document Metadata */}
          {documentMetadata && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Document Analysis</h4>
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                {documentMetadata.document_type && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Document Type:</span>
                    <span className="text-gray-900 font-medium">{documentMetadata.document_type}</span>
                  </div>
                )}
                {documentMetadata.extraction_timestamp && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Processed:</span>
                    <span className="text-gray-900">{new Date(documentMetadata.extraction_timestamp).toLocaleString()}</span>
                  </div>
                )}
                {documentMetadata.overall_confidence !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Overall Confidence:</span>
                    <span className={`font-medium ${
                      overallConfidence >= 0.8 ? 'text-green-600' : 
                      overallConfidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(overallConfidence * 100)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Validation Flags */}
          {hasValidationFlags && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Validation Results</h4>
              <div className="space-y-2">
                {Object.entries(validationFlags).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {value ? '✓ Pass' : '✗ Fail'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Justification Report */}
          {report && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Field Extraction Reasoning</h4>
              <div className="prose prose-sm max-w-none">
                <div 
                  className="text-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: formatReport(report) 
                  }}
                />
              </div>
            </div>
          )}

          {/* Fallback message */}
          {!report && !hasValidationFlags && !documentMetadata && (
            <div className="text-center py-8">
              <DocumentMagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-500">
                No AI analysis report available for this document.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}