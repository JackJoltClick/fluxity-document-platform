import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { Button } from '../foundations/Button'

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Main heading
   */
  title: string
  /**
   * Description text
   */
  description: string
  /**
   * Icon to display
   */
  icon?: React.ReactNode
  /**
   * Primary action
   */
  primaryAction?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
  /**
   * Secondary action
   */
  secondaryAction?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
  /**
   * Variant style
   */
  variant?: 'default' | 'compact'
}

const defaultIcon = (
  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(({
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  variant = 'default',
  className,
  children,
  ...props
}, ref) => {
  const isCompact = variant === 'compact'
  
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        isCompact ? 'p-8' : 'p-12',
        className
      )}
      {...props}
    >
      <div className={cn(
        'text-center',
        isCompact ? 'py-8' : 'py-16'
      )}>
        <div className={cn(
          'bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-6',
          isCompact ? 'w-16 h-16' : 'w-20 h-20'
        )}>
          {icon || defaultIcon}
        </div>
        
        <h3 className={cn(
          'font-light text-gray-900 mb-3 tracking-tight',
          isCompact ? 'text-xl' : 'text-2xl'
        )}>
          {title}
        </h3>
        
        <p className={cn(
          'text-gray-500 font-light mb-8',
          isCompact ? 'text-sm' : 'text-base'
        )}>
          {description}
        </p>
        
        {children}
        
        {(primaryAction || secondaryAction) && (
          <div className="flex items-center justify-center space-x-4">
            {primaryAction && (
              <Button
                variant="primary"
                size={isCompact ? "md" : "lg"}
                icon={primaryAction.icon}
                onClick={() => window.location.href = primaryAction.href}
              >
                {primaryAction.label}
              </Button>
            )}
            
            {secondaryAction && (
              <Button
                variant="secondary"
                size={isCompact ? "md" : "lg"}
                icon={secondaryAction.icon}
                onClick={() => window.location.href = secondaryAction.href}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

EmptyState.displayName = 'EmptyState'