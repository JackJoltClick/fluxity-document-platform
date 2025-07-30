import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { Button } from '../foundations/Button'
import { StatusIndicator } from '../feedback/StatusIndicator'

export interface DashboardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * User's display name or email
   */
  userName?: string
  /**
   * Time-based greeting
   */
  greeting?: string
  /**
   * Business insight or status message
   */
  insight?: string
  /**
   * System status
   */
  systemStatus?: 'operational' | 'processing' | 'warning' | 'error'
  /**
   * Custom action button
   */
  actionButton?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
  /**
   * Last updated timestamp
   */
  lastUpdated?: string
}

const getDefaultGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export const DashboardHeader = React.forwardRef<HTMLDivElement, DashboardHeaderProps>(({
  userName = 'there',
  greeting,
  insight = '📈 Your document intelligence platform is running smoothly',
  systemStatus = 'operational',
  actionButton = {
    label: 'Upload Documents',
    href: '/documents/upload'
  },
  lastUpdated = 'just now',
  className,
  ...props
}, ref) => {
  const displayGreeting = greeting || getDefaultGreeting()
  const displayName = userName?.includes('@') ? userName.split('@')[0] : userName

  const defaultUploadIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )

  const statusLabels = {
    operational: 'All systems operational',
    processing: 'Processing documents',
    warning: 'Some services degraded',
    error: 'System issues detected'
  }

  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm p-10',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h1 className="text-4xl font-light text-gray-900 mb-3 tracking-tight">
            {displayGreeting}, {displayName}
          </h1>
          <p className="text-xl text-gray-500 font-light mb-6">
            {insight}
          </p>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <StatusIndicator 
                status={systemStatus} 
                variant="dot" 
                animated={systemStatus === 'operational' || systemStatus === 'processing'}
              />
              <span className="text-sm text-gray-600 font-medium">
                {statusLabels[systemStatus]}
              </span>
            </div>
            <div className="text-gray-300">•</div>
            <span className="text-sm text-gray-400">
              Last updated: {lastUpdated}
            </span>
          </div>
        </div>
        
        {actionButton && (
          <div className="flex items-center space-x-4">
            <Button
              variant="primary"
              size="lg"
              icon={actionButton.icon || defaultUploadIcon}
              onClick={() => window.location.href = actionButton.href}
            >
              {actionButton.label}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})

DashboardHeader.displayName = 'DashboardHeader'