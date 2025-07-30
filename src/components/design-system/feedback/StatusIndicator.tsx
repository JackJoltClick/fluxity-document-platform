import React from 'react'
import { cn } from '@/src/lib/utils'

export interface StatusIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Status type following Square design philosophy
   */
  status: 'operational' | 'processing' | 'success' | 'warning' | 'error' | 'offline'
  /**
   * Display variant
   */  
  variant?: 'dot' | 'badge' | 'pill'
  /**
   * Size of the indicator
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Whether to show animation for active states
   */
  animated?: boolean
  /**
   * Custom label text
   */
  label?: string
}

const statusConfig = {
  operational: {
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    label: 'Operational'
  },
  processing: {
    color: 'bg-blue-500', 
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    label: 'Processing'
  },
  success: {
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-50', 
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    label: 'Success'
  },
  warning: {
    color: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700', 
    borderColor: 'border-amber-200',
    label: 'Warning'
  },
  error: {
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200', 
    label: 'Error'
  },
  offline: {
    color: 'bg-gray-400',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    label: 'Offline'
  }
}

const dotSizes = {
  sm: 'w-2 h-2',
  md: 'w-3 h-3', 
  lg: 'w-4 h-4'
}

const badgeSizes = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base'
}

export const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(({
  status,
  variant = 'dot',
  size = 'md',
  animated = false,
  label,
  className,
  children,
  ...props
}, ref) => {
  const config = statusConfig[status] || statusConfig.warning
  const displayLabel = label || config.label

  if (variant === 'dot') {
    return (
      <div
        ref={ref}
        className={cn('flex items-center space-x-3', className)}
        {...props}
      >
        <div 
          className={cn(
            'rounded-full',
            config.color,
            dotSizes[size],
            animated && (status === 'operational' || status === 'processing') && 'animate-pulse'
          )}
        />
        {(displayLabel || children) && (
          <span className={cn('text-sm font-medium', config.textColor)}>
            {children || displayLabel}
          </span>
        )}
      </div>
    )
  }

  if (variant === 'badge') {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          config.bgColor,
          config.textColor,
          config.borderColor,
          badgeSizes[size],
          className
        )}
        {...props}
      >
        <div 
          className={cn(
            'rounded-full mr-2',
            config.color,
            dotSizes.sm,
            animated && (status === 'operational' || status === 'processing') && 'animate-pulse'
          )}
        />
        {children || displayLabel}
      </span>
    )
  }

  if (variant === 'pill') {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          config.bgColor,
          config.textColor,
          badgeSizes[size],
          className
        )}
        {...props}
      >
        <div 
          className={cn(
            'rounded-full mr-2',
            config.color,
            dotSizes.sm,
            animated && (status === 'operational' || status === 'processing') && 'animate-pulse'
          )}
        />
        {children || displayLabel}
      </div>
    )
  }

  return null
})

StatusIndicator.displayName = 'StatusIndicator'