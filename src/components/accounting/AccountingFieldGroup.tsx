'use client'

import React, { useState } from 'react'
import { cn } from '@/src/lib/utils'
import { ConfidenceIndicator } from './ConfidenceIndicator'
import { 
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

export interface AccountingFieldGroupProps {
  title: string
  description?: string
  children: React.ReactNode
  confidence?: number
  defaultExpanded?: boolean
  required?: boolean
  className?: string
}

export const AccountingFieldGroup: React.FC<AccountingFieldGroupProps> = ({
  title,
  description,
  children,
  confidence,
  defaultExpanded = true,
  required = false,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div
        className="px-6 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDownIcon className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-gray-400" />
              )}
              <h3 className="text-lg font-medium text-gray-900">
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
              </h3>
            </div>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
          
          {confidence !== undefined && (
            <ConfidenceIndicator 
              confidence={confidence} 
              variant="dot" 
              size="sm"
            />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-6">
          <div className="space-y-6">
            {children}
          </div>
        </div>
      )}
    </div>
  )
}