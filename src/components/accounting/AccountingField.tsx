'use client'

import React, { useState } from 'react'
import { cn } from '@/src/lib/utils'
import { ConfidenceIndicator } from './ConfidenceIndicator'
import { 
  PencilIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export interface AccountingFieldProps {
  label: string
  value: string | number | null
  confidence: number
  fieldKey: string
  editable?: boolean
  type?: 'text' | 'number' | 'date' | 'select' | 'textarea'
  options?: Array<{ value: string; label: string }>
  placeholder?: string
  onEdit?: (fieldKey: string, newValue: string | number) => Promise<void>
  // onResuggest?: (fieldKey: string) => void  // Commented out as requested
  isLoading?: boolean
  error?: string
  required?: boolean
  className?: string
}

export const AccountingField: React.FC<AccountingFieldProps> = ({
  label,
  value,
  confidence,
  fieldKey,
  editable = true,
  type = 'text',
  options = [],
  placeholder,
  onEdit,
  // onResuggest,  // Commented out as requested
  isLoading = false,
  error,
  required = false,
  className
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value?.toString() || '')

  const handleStartEdit = () => {
    setIsEditing(true)
    setEditValue(value?.toString() || '')
  }

  const handleSaveEdit = async () => {
    if (onEdit) {
      try {
        const processedValue = type === 'number' ? parseFloat(editValue) || 0 : editValue
        await onEdit(fieldKey, processedValue)
        setIsEditing(false)
      } catch (error) {
        console.error('Error saving field:', error)
        // Keep editing mode open on error
      }
    }
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    setEditValue(value?.toString() || '')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  // Handle objects being passed as values (for debugging)
  let displayValue = 'List to match'
  if (value !== null && value !== undefined) {
    if (typeof value === 'object') {
      // If it's an object, try to get the actual value or stringify it
      const objValue = value as any
      displayValue = objValue.value !== undefined ? String(objValue.value) : JSON.stringify(value)
    } else {
      displayValue = String(value)
    }
  }
  const isEmpty = !value

  const renderEditControl = () => {
    if (type === 'select' && options.length > 0) {
      return (
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSaveEdit}
          onKeyDown={handleKeyPress}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
          autoFocus
        >
          <option value="">Select...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
          rows={3}
          autoFocus
        />
      )
    }

    return (
      <input
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
        autoFocus
      />
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Field Header */}
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center space-x-2">
          {/* Field-level confidence temporarily disabled - will be re-enabled later
          <ConfidenceIndicator 
            confidence={confidence} 
            variant="badge" 
            size="sm"
          />
          */}
          {editable && !isEditing && !isLoading && (
            <button
              onClick={handleStartEdit}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Edit field"
            >
              <PencilIcon className="w-4 h-4" />
            </button>
          )}
          {/* Re-suggest functionality commented out as requested
          {onResuggest && (
            <button
              onClick={() => onResuggest(fieldKey)}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
              title="Re-suggest value"
            >
              <ArrowPathIcon className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          )}
          */}
        </div>
      </div>

      {/* Field Content */}
      <div className="relative">
        {isEditing ? (
          <div className="space-y-2">
            {renderEditControl()}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveEdit}
                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <CheckIcon className="w-3 h-3 mr-1" />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XMarkIcon className="w-3 h-3 mr-1" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm min-h-[38px] flex items-center',
              isEmpty && 'text-gray-500 italic'
              /* Confidence-based styling temporarily disabled
              confidence < 0.5 && 'border-red-200 bg-red-50',
              confidence >= 0.5 && confidence < 0.8 && 'border-yellow-200 bg-yellow-50',
              confidence >= 0.8 && 'border-green-200 bg-green-50'
              */
            )}
          >
            {displayValue}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <ArrowPathIcon className="w-4 h-4 animate-spin" />
          <span>Updating...</span>
        </div>
      )}
    </div>
  )
}