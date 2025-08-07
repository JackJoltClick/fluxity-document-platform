import React from 'react'
import { cn } from '@/src/lib/utils'

interface ConfidenceIndicatorProps {
  confidence: number // 0.0 to 1.0
  label?: string
  size?: 'sm' | 'md' | 'lg'
  showPercentage?: boolean
  className?: string
}

export function ConfidenceIndicator({ 
  confidence, 
  label, 
  size = 'md', 
  showPercentage = true,
  className 
}: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100)
  
  // Color based on confidence level
  const getConfidenceColor = (conf: number): string => {
    if (conf >= 0.95) return 'bg-emerald-500 text-emerald-50'
    if (conf >= 0.90) return 'bg-green-500 text-green-50'
    if (conf >= 0.80) return 'bg-blue-500 text-blue-50'
    if (conf >= 0.70) return 'bg-yellow-500 text-yellow-50'
    if (conf >= 0.60) return 'bg-orange-500 text-orange-50'
    return 'bg-red-500 text-red-50'
  }
  
  const getConfidenceText = (conf: number): string => {
    if (conf >= 0.95) return 'Excellent'
    if (conf >= 0.90) return 'Very Good'
    if (conf >= 0.80) return 'Good'
    if (conf >= 0.70) return 'Fair'
    if (conf >= 0.60) return 'Poor'
    return 'Very Poor'
  }
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }
  
  return (
    <div className={cn('inline-flex items-center gap-1.5', className)}>
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}:
        </span>
      )}
      
      <div className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        getConfidenceColor(confidence),
        sizeClasses[size]
      )}>
        {/* Confidence bar */}
        <div className="flex items-center gap-1">
          <div className="w-12 h-1.5 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white/80 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          
          {showPercentage && (
            <span className="font-semibold">
              {percentage}%
            </span>
          )}
        </div>
      </div>
      
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {getConfidenceText(confidence)}
      </span>
    </div>
  )
}

interface HybridConfidenceDisplayProps {
  overallConfidence: number
  textractConfidence?: number
  openaiConfidence?: number
  crossValidationScore?: number
  className?: string
  detailed?: boolean
}

export function HybridConfidenceDisplay({ 
  overallConfidence,
  textractConfidence,
  openaiConfidence,
  crossValidationScore,
  className,
  detailed = false
}: HybridConfidenceDisplayProps) {
  if (!detailed) {
    return (
      <ConfidenceIndicator 
        confidence={overallConfidence}
        label="Confidence"
        className={className}
      />
    )
  }
  
  return (
    <div className={cn('space-y-2', className)}>
      <ConfidenceIndicator 
        confidence={overallConfidence}
        label="Overall"
        size="md"
      />
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        {textractConfidence !== undefined && (
          <ConfidenceIndicator 
            confidence={textractConfidence}
            label="Textract"
            size="sm"
            showPercentage={false}
          />
        )}
        
        {openaiConfidence !== undefined && (
          <ConfidenceIndicator 
            confidence={openaiConfidence}
            label="OpenAI"
            size="sm"
            showPercentage={false}
          />
        )}
      </div>
      
      {crossValidationScore !== undefined && (
        <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
          <ConfidenceIndicator 
            confidence={crossValidationScore}
            label="Agreement"
            size="sm"
          />
        </div>
      )}
    </div>
  )
}