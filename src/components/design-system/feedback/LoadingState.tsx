import React from 'react'
import { cn } from '@/src/lib/utils'

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Loading variant following Square design philosophy
   */
  variant?: 'spinner' | 'skeleton' | 'dots' | 'pulse'
  /**
   * Size of the loading indicator
   */
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Loading message
   */
  message?: string
  /**
   * Center the loading state
   */
  centered?: boolean
  /**
   * Show inline (for smaller loading states)
   */
  inline?: boolean
}

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
}

const messageSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg'
}

export const LoadingState = React.forwardRef<HTMLDivElement, LoadingStateProps>(({
  variant = 'spinner',
  size = 'md',
  message,
  centered = false,
  inline = false,
  className,
  children,
  ...props
}, ref) => {
  const containerClasses = cn(
    inline ? 'inline-flex items-center space-x-3' : 'flex flex-col items-center space-y-3',
    centered && 'justify-center min-h-[200px]',
    className
  )

  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return (
          <div 
            className={cn(
              'border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin',
              spinnerSizes[size]
            )}
          />
        )
      
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div className={cn('bg-blue-600 rounded-full animate-bounce', spinnerSizes.sm)} style={{ animationDelay: '0ms' }} />
            <div className={cn('bg-blue-600 rounded-full animate-bounce', spinnerSizes.sm)} style={{ animationDelay: '150ms' }} />
            <div className={cn('bg-blue-600 rounded-full animate-bounce', spinnerSizes.sm)} style={{ animationDelay: '300ms' }} />
          </div>
        )
      
      case 'pulse':
        return (
          <div className={cn('bg-blue-600 rounded-full animate-pulse', spinnerSizes[size])} />
        )
      
      case 'skeleton':
        return (
          <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div
      ref={ref}
      className={containerClasses}
      {...props}
    >
      {renderLoadingIndicator()}
      {(message || children) && (
        <div className={cn(
          'font-light text-gray-600',
          messageSizes[size],
          inline && 'whitespace-nowrap'
        )}>
          {children || message}
        </div>
      )}
    </div>
  )
})

LoadingState.displayName = 'LoadingState'