'use client'

import React from 'react'
import { cn } from '@/src/lib/utils'
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  XCircleIcon,
  SparklesIcon,
  CpuChipIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface FieldConfidenceIndicatorProps {
  fieldName: string
  value: any
  confidence?: number
  source?: 'textract' | 'openai' | 'claude' | 'consensus' | 'manual'
  agreement?: 'unanimous' | 'majority' | 'conflict'
  validationStatus?: 'valid' | 'warning' | 'error'
  validationMessage?: string
  className?: string
}

export function FieldConfidenceIndicator({
  fieldName,
  value,
  confidence = 0,
  source,
  agreement,
  validationStatus,
  validationMessage,
  className
}: FieldConfidenceIndicatorProps) {
  // Determine confidence level
  const getConfidenceLevel = (): 'high' | 'medium' | 'low' => {
    if (confidence >= 0.9) return 'high'
    if (confidence >= 0.7) return 'medium'
    return 'low'
  }

  const confidenceLevel = getConfidenceLevel()

  // Get color scheme based on confidence
  const getColorScheme = () => {
    if (validationStatus === 'error') {
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-700',
        icon: 'text-red-500'
      }
    }
    
    if (validationStatus === 'warning') {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        icon: 'text-yellow-500'
      }
    }

    switch (confidenceLevel) {
      case 'high':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          icon: 'text-green-500'
        }
      case 'medium':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: 'text-blue-500'
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'text-gray-500'
        }
    }
  }

  const colors = getColorScheme()

  // Get icon based on status
  const getIcon = () => {
    if (validationStatus === 'error') {
      return <XCircleIcon className="w-4 h-4" />
    }
    if (validationStatus === 'warning') {
      return <ExclamationTriangleIcon className="w-4 h-4" />
    }
    if (agreement === 'unanimous') {
      return <CheckCircleIcon className="w-4 h-4" />
    }
    if (source === 'manual') {
      return <EyeIcon className="w-4 h-4" />
    }
    if (source === 'consensus') {
      return <SparklesIcon className="w-4 h-4" />
    }
    return <CpuChipIcon className="w-4 h-4" />
  }

  // Get source label
  const getSourceLabel = () => {
    if (source === 'manual') return 'Manually reviewed'
    if (source === 'consensus') return `Consensus (${agreement})`
    if (source) return source.charAt(0).toUpperCase() + source.slice(1)
    return 'Unknown source'
  }

  // Format value for display
  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return 'Not extracted'
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  return (
    <div className={cn('rounded-lg border p-3', colors.bg, colors.border, className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </label>
            <div className={cn('flex items-center gap-1', colors.icon)}>
              {getIcon()}
              <span className="text-xs">
                {(confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          
          <div className="mt-1">
            <p className={cn('text-sm font-mono', colors.text)}>
              {formatValue(value)}
            </p>
          </div>
          
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
            <span>Source: {getSourceLabel()}</span>
            {agreement && (
              <span className={cn(
                'px-2 py-0.5 rounded-full',
                agreement === 'unanimous' ? 'bg-green-100 text-green-700' :
                agreement === 'majority' ? 'bg-blue-100 text-blue-700' :
                'bg-yellow-100 text-yellow-700'
              )}>
                {agreement}
              </span>
            )}
          </div>
          
          {validationMessage && (
            <div className={cn('mt-2 text-xs', colors.text)}>
              ⚠️ {validationMessage}
            </div>
          )}
        </div>
        
        {/* Confidence bar */}
        <div className="ml-4 w-24">
          <div className="text-xs text-gray-500 mb-1">Confidence</div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={cn(
                'h-full transition-all duration-300',
                confidenceLevel === 'high' ? 'bg-green-500' :
                confidenceLevel === 'medium' ? 'bg-blue-500' :
                'bg-gray-400'
              )}
              style={{ width: `${confidence * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// Export a group component for multiple fields
export function FieldConfidenceGroup({
  fields,
  className
}: {
  fields: Array<FieldConfidenceIndicatorProps>
  className?: string
}) {
  // Group fields by confidence level
  const highConfidence = fields.filter(f => (f.confidence || 0) >= 0.9)
  const mediumConfidence = fields.filter(f => (f.confidence || 0) >= 0.7 && (f.confidence || 0) < 0.9)
  const lowConfidence = fields.filter(f => (f.confidence || 0) < 0.7)
  const withErrors = fields.filter(f => f.validationStatus === 'error')

  return (
    <div className={cn('space-y-4', className)}>
      {withErrors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-2">
            Fields with Validation Errors ({withErrors.length})
          </h3>
          <div className="space-y-2">
            {withErrors.map((field, idx) => (
              <FieldConfidenceIndicator key={idx} {...field} />
            ))}
          </div>
        </div>
      )}
      
      {lowConfidence.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">
            Low Confidence Fields ({lowConfidence.length})
          </h3>
          <div className="space-y-2">
            {lowConfidence.map((field, idx) => (
              <FieldConfidenceIndicator key={idx} {...field} />
            ))}
          </div>
        </div>
      )}
      
      {mediumConfidence.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-blue-700 mb-2">
            Medium Confidence Fields ({mediumConfidence.length})
          </h3>
          <div className="space-y-2">
            {mediumConfidence.map((field, idx) => (
              <FieldConfidenceIndicator key={idx} {...field} />
            ))}
          </div>
        </div>
      )}
      
      {highConfidence.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-green-700 mb-2">
            High Confidence Fields ({highConfidence.length})
          </h3>
          <div className="space-y-2">
            {highConfidence.map((field, idx) => (
              <FieldConfidenceIndicator key={idx} {...field} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}