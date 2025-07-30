import React from 'react'
import { cn } from '@/src/lib/utils'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

export interface ConfidenceIndicatorProps {
  confidence: number
  variant?: 'badge' | 'dot' | 'bar'
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  className?: string
}

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) {
    return {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      dot: 'bg-green-500'
    }
  } else if (confidence >= 0.5) {
    return {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500'
    }
  } else {
    return {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    }
  }
}

const getConfidenceLabel = (confidence: number) => {
  if (confidence >= 0.8) return 'High Confidence'
  if (confidence >= 0.5) return 'Medium Confidence'
  return 'Low Confidence'
}

const getConfidenceDescription = (confidence: number) => {
  if (confidence >= 0.8) {
    return 'This field was mapped with high confidence. The business logic found a strong match.'
  } else if (confidence >= 0.5) {
    return 'This field was mapped with medium confidence. Manual review may be helpful.'
  } else {
    return 'This field has low confidence. Please review and verify the mapping is correct.'
  }
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  variant = 'badge',
  size = 'md',
  showTooltip = true,
  className
}) => {
  const colors = getConfidenceColor(confidence)
  const percentage = Math.round(confidence * 100)
  const label = getConfidenceLabel(confidence)
  const description = getConfidenceDescription(confidence)

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  }

  if (variant === 'badge') {
    const content = (
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium border',
          colors.bg,
          colors.text,
          colors.border,
          sizeClasses[size],
          className
        )}
      >
        {percentage}%
        {showTooltip && (
          <InformationCircleIcon className="ml-1 w-3 h-3 opacity-60" />
        )}
      </span>
    )

    if (showTooltip) {
      return (
        <div className="relative group">
          {content}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <div className="font-medium">{label}</div>
            <div className="mt-1 text-gray-300">{description}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )
    }

    return content
  }

  if (variant === 'dot') {
    const content = (
      <div className="flex items-center space-x-2">
        <div
          className={cn(
            'rounded-full',
            colors.dot,
            dotSizeClasses[size]
          )}
        />
        <span className={cn('text-sm font-medium', colors.text)}>
          {percentage}%
        </span>
      </div>
    )

    if (showTooltip) {
      return (
        <div className="relative group">
          {content}
          <div className="absolute bottom-full left-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <div className="font-medium">{label}</div>
            <div className="mt-1 text-gray-300">{description}</div>
            <div className="absolute top-full left-4 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )
    }

    return content
  }

  if (variant === 'bar') {
    return (
      <div className={cn('w-full', className)}>
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-gray-700">Confidence</span>
          <span className={cn('text-sm font-medium', colors.text)}>
            {percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn('h-2 rounded-full transition-all duration-300', colors.dot)}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showTooltip && (
          <div className="mt-1 text-xs text-gray-500">
            {label} - {description}
          </div>
        )}
      </div>
    )
  }

  return null
}