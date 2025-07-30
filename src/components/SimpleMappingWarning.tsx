'use client'

import { useState } from 'react'
import { ExclamationTriangleIcon, CogIcon, XMarkIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline'
import { useSystemMode } from '@/src/hooks/useSystemMode'

interface SimpleMappingWarningProps {
  className?: string
  dismissible?: boolean
  context?: 'general' | 'accounting' | 'confidence'
}

export function SimpleMappingWarning({ 
  className = '', 
  dismissible = false,
  context = 'general'
}: SimpleMappingWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const { data: systemMode, isLoading } = useSystemMode()

  // Don't render if not in simple mode, still loading, or dismissed
  if (!systemMode?.simple_mapping_mode || isLoading || (dismissible && isDismissed)) {
    return null
  }

  // Context-specific content
  const getContextContent = () => {
    switch (context) {
      case 'accounting':
        return {
          title: 'Simple Mapping Mode: Direct Field Assignment',
          description: 'Accounting fields are mapped directly from extracted data with default values. Company mappings, GL account assignments, and cost center rules are bypassed, but vendor extraction rules are still active to guide AI extraction.',
          impacts: [
            { type: 'success', text: 'Higher confidence scores (80%+)' },
            { type: 'success', text: 'Faster document processing' },
            { type: 'success', text: 'Vendor extraction rules active' },
            { type: 'warning', text: 'No custom business rule validation' },
            { type: 'warning', text: 'Default GL accounts and cost centers' }
          ]
        }
      case 'confidence':
        return {
          title: 'High Confidence Scores Explained',
          description: 'These high confidence scores are from direct field mapping, not complex business rule analysis. Enable Advanced Mode for custom business logic validation.',
          impacts: [
            { type: 'info', text: 'Direct extraction → field mapping' },
            { type: 'info', text: 'Minimal business rule processing' },
            { type: 'warning', text: 'May not reflect actual mapping accuracy' }
          ]
        }
      default:
        return {
          title: 'Simple Mapping Mode Active',
          description: 'Documents are processed using direct SAP field mapping with vendor extraction rules still active. Complex business rules are disabled for faster processing.',
          impacts: [
            { type: 'success', text: 'Faster processing' },
            { type: 'success', text: 'Higher confidence scores' },
            { type: 'success', text: 'Vendor extraction rules active' },
            { type: 'warning', text: 'No complex business rule matching' }
          ]
        }
    }
  }

  const content = getContextContent()

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {context === 'confidence' ? (
            <ShieldExclamationIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center">
            <h3 className="text-sm font-medium text-yellow-800">
              {content.title}
            </h3>
            <CogIcon className="h-4 w-4 text-yellow-600 ml-2" />
          </div>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{content.description}</p>
            <div className="mt-3">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                {content.impacts.map((impact, index) => (
                  <div key={index} className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      impact.type === 'success' ? 'bg-green-400' :
                      impact.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`}></div>
                    <span>{impact.text}</span>
                  </div>
                ))}
              </div>
            </div>
            {context === 'accounting' && (
              <div className="mt-3 p-2 bg-yellow-100 rounded text-xs">
                <strong>Impact on your workflow:</strong> Documents will show high confidence and be marked as "ready for export" 
                but may not reflect your actual business logic requirements. Vendor extraction rules will still help improve data accuracy.
              </div>
            )}
          </div>
        </div>
        {dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="inline-flex bg-yellow-50 rounded-md p-1.5 text-yellow-500 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
              >
                <span className="sr-only">Dismiss</span>
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}