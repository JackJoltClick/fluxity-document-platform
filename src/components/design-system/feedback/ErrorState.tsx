import React from 'react'
import { cn } from '@/src/lib/utils'

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Error title
   */
  title: string
  /**
   * Error message
   */
  message: string
  /**
   * Error variant
   */
  variant?: 'error' | 'warning' | 'info'
  /**
   * Custom icon
   */
  icon?: React.ReactNode
  /**
   * Primary action button
   */
  primaryAction?: {
    label: string
    onClick: () => void
    loading?: boolean
    icon?: React.ReactNode
  }
  /**
   * Secondary action button
   */
  secondaryAction?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
  /**
   * Compact mode
   */
  compact?: boolean
}

const variantConfig = {
  error: {
    containerClass: 'bg-red-50 border-red-200',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-500',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700',
    defaultIcon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  warning: {
    containerClass: 'bg-amber-50 border-amber-200',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-900',
    messageColor: 'text-amber-700',
    defaultIcon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.992-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    )
  },
  info: {
    containerClass: 'bg-blue-50 border-blue-200',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700',
    defaultIcon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
}

export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(({
  title,
  message,
  variant = 'error',
  icon,
  primaryAction,
  secondaryAction,
  compact = false,
  className,
  children,
  ...props
}, ref) => {
  const config = variantConfig[variant]
  
  return (
    <div
      ref={ref}
      className={cn(
        'border rounded-lg',
        config.containerClass,
        compact ? 'p-6' : 'p-12',
        className
      )}
      {...props}
    >
      <div className={cn(
        'text-center',
        compact ? 'py-8' : 'py-16'
      )}>
        <div className={cn(
          'rounded-lg flex items-center justify-center mx-auto mb-6',
          config.iconBg,
          config.iconColor,
          compact ? 'w-12 h-12' : 'w-16 h-16'
        )}>
          {icon || config.defaultIcon}
        </div>
        
        <h3 className={cn(
          'font-light mb-3 tracking-tight',
          config.titleColor,
          compact ? 'text-xl' : 'text-2xl'
        )}>
          {title}
        </h3>
        
        <p className={cn(
          'font-light mb-6',
          config.messageColor,
          compact ? 'text-sm' : 'text-base'
        )}>
          {message}
        </p>
        
        {children}
        
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center justify-center space-x-4">
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                disabled={primaryAction.loading}
                className={cn(
                  'stripe-button stripe-button-primary disabled:opacity-50 disabled:cursor-not-allowed',
                  compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'
                )}
              >
                {primaryAction.loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    {primaryAction.icon}
                    <span>{primaryAction.label}</span>
                  </div>
                )}
              </button>
            )}
            
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className={cn(
                  'stripe-button stripe-button-secondary',
                  compact ? 'px-4 py-2 text-sm' : 'px-6 py-3'
                )}
              >
                <div className="flex items-center space-x-2">
                  {secondaryAction.icon}
                  <span>{secondaryAction.label}</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

ErrorState.displayName = 'ErrorState'