import React from 'react'
import { cn } from '@/src/lib/utils'

export interface ProcessingProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Processing status
   */
  status: 'pending' | 'processing' | 'completed' | 'failed'
  /**
   * Progress percentage (0-100)
   */
  progress: number
  /**
   * Custom title
   */
  title?: string
  /**
   * Custom description
   */
  description?: string
  /**
   * Additional info text
   */
  infoText?: string
  /**
   * Retry function for failed state
   */
  onRetry?: () => void
  /**
   * Whether retry is in progress
   */
  retrying?: boolean
}

const statusConfig = {
  pending: {
    color: 'amber',
    title: 'Queued for Processing',
    description: 'Document in processing queue',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  processing: {
    color: 'blue',
    title: 'AI Intelligence Processing',
    description: 'Extracting structured data',
    icon: (
      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
    )
  },
  completed: {
    color: 'green',
    title: 'Processing Complete',
    description: 'Document successfully processed',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  failed: {
    color: 'red',
    title: 'Processing Failed',
    description: 'Document processing encountered an error',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
}

export const ProcessingProgress = React.forwardRef<HTMLDivElement, ProcessingProgressProps>(({
  status,
  progress,
  title,
  description,
  infoText,
  onRetry,
  retrying = false,
  className,
  ...props
}, ref) => {
  const config = statusConfig[status]
  const displayTitle = title || config.title
  const displayDescription = description || config.description
  
  const containerClasses = {
    pending: 'bg-gradient-to-r from-amber-50 to-amber-100 border-amber-200',
    processing: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
    completed: 'bg-gradient-to-r from-green-50 to-green-100 border-green-200',
    failed: 'bg-red-50 border-red-200'
  }
  
  const textClasses = {
    pending: 'text-amber-900',
    processing: 'text-blue-900',
    completed: 'text-green-900',
    failed: 'text-red-900'
  }
  
  const subtextClasses = {
    pending: 'text-amber-700',
    processing: 'text-blue-700',
    completed: 'text-green-700',
    failed: 'text-red-700'
  }
  
  const iconBgClasses = {
    pending: 'bg-amber-500',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-100'
  }
  
  const progressBarClasses = {
    pending: 'bg-amber-500',
    processing: 'bg-blue-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500'
  }

  const defaultInfoText = {
    pending: 'Your document has been received and will begin intelligent processing within moments.',
    processing: 'Our AI is analyzing your document to extract key information including suppliers, amounts, dates, and line items. This process typically completes within 20-30 seconds.',
    completed: 'Document processing completed successfully. All data has been extracted and is ready for review.',
    failed: 'Document processing encountered an error. You can retry processing or upload the document again.'
  }

  return (
    <div
      ref={ref}
      className={cn(
        'border rounded-lg p-8 shadow-sm',
        containerClasses[status],
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <div className={cn(
            'w-12 h-12 rounded-lg flex items-center justify-center',
            status === 'failed' ? iconBgClasses[status] : iconBgClasses[status]
          )}>
            {config.icon}
          </div>
          <div>
            <h2 className={cn(
              'text-xl font-light tracking-tight',
              textClasses[status]
            )}>
              {displayTitle}
            </h2>
            <p className={cn(
              'text-sm font-light mt-1',
              subtextClasses[status]
            )}>
              {displayDescription}
            </p>
          </div>
        </div>
        
        {status !== 'failed' && (
          <div className="text-right">
            <div className={cn(
              'text-2xl font-light',
              textClasses[status]
            )}>
              {Math.round(progress)}%
            </div>
            <div className={cn(
              'text-sm font-light',
              subtextClasses[status]
            )}>
              Complete
            </div>
          </div>
        )}
      </div>
      
      {/* Progress Bar */}
      {status !== 'failed' && (
        <div className="w-full bg-white/50 rounded-full h-3 mb-6">
          <div 
            className={cn(
              'h-3 rounded-full transition-all duration-500 ease-out',
              progressBarClasses[status]
            )}
            style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
          />
        </div>
      )}
      
      {/* Info Text */}
      <div className={cn(
        'text-base leading-relaxed font-light',
        subtextClasses[status]
      )}>
        {infoText || defaultInfoText[status]}
      </div>
      
      {/* Retry Button for Failed State */}
      {status === 'failed' && onRetry && (
        <div className="flex items-center space-x-4 mt-6">
          <button
            onClick={onRetry}
            disabled={retrying}
            className="stripe-button stripe-button-primary px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {retrying ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Retrying...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Retry Processing</span>
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  )
})

ProcessingProgress.displayName = 'ProcessingProgress'