import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { StatusIndicator } from '../feedback/StatusIndicator'
import { Button } from '../foundations/Button'

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Page title
   */
  title: string
  /**
   * Page subtitle/description
   */
  subtitle?: string
  /**
   * Status information
   */
  status?: {
    type: 'operational' | 'processing' | 'warning' | 'error' | 'offline'
    label: string
    animated?: boolean
  }
  /**
   * Primary action button
   */
  primaryAction?: {
    label: string
    href: string
    icon?: React.ReactNode
    className?: string
  }
  /**
   * Additional actions
   */
  actions?: React.ReactNode
  /**
   * Breadcrumb navigation
   */
  breadcrumb?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
}

const defaultUploadIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const defaultBackIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
)

export const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(({
  title,
  subtitle,
  status,
  primaryAction,
  actions,
  breadcrumb,
  className,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm p-8',
        className
      )}
      {...props}
    >
      {breadcrumb && (
        <div className="mb-6">
          <Link
            href={breadcrumb.href}
            className="text-blue-600 hover:text-blue-700 text-base font-medium transition-colors flex items-center space-x-2"
          >
            {breadcrumb.icon || defaultBackIcon}
            <span>{breadcrumb.label}</span>
          </Link>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-3">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xl text-gray-500 font-light mb-6">
              {subtitle}
            </p>
          )}
          
          {status && (
            <div className="flex items-center space-x-6">
              <StatusIndicator
                status={status.type}
                variant="dot"
                animated={status.animated}
                label={status.label}
              />
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {actions}
          {primaryAction && (
            <Button
              variant="primary"
              size="lg"
              icon={primaryAction.icon || defaultUploadIcon}
              className={primaryAction.className}
              onClick={() => window.location.href = primaryAction.href}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
})

PageHeader.displayName = 'PageHeader'