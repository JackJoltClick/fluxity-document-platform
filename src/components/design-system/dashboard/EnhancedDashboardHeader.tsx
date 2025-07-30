import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { Card, CardContent } from '@/src/components/design-system/layout/Card'

interface QuickStat {
  label: string
  value: string | number
  trend?: {
    direction: 'up' | 'down' | 'neutral'
    percentage?: number
    label?: string
  }
  iconType?: 'document' | 'check' | 'dollar' | 'clock'
}

interface SystemStatus {
  type: 'operational' | 'processing' | 'warning' | 'error' | 'maintenance'
  label: string
  details?: string
  lastUpdated?: string
}

export interface EnhancedDashboardHeaderProps {
  userName?: string
  greeting?: string
  quickStats?: QuickStat[]
  systemStatus?: SystemStatus
  primaryAction?: {
    label: string
    href: string
    icon?: React.ReactNode
  }
  secondaryActions?: Array<{
    label: string
    href: string
    icon?: React.ReactNode
  }>
  className?: string
}

const getPersonalizedGreeting = (name?: string) => {
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  
  if (!name) return `${timeGreeting}!`
  
  // Clean up the name (remove email domain, etc.)
  const cleanName = name.includes('@') ? name.split('@')[0] : name
  const displayName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1)
  
  return `${timeGreeting}, ${displayName}`
}

const getStatusConfig = (status: SystemStatus['type']) => {
  const configs = {
    operational: {
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      dotColor: 'bg-emerald-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    processing: {
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200', 
      dotColor: 'bg-blue-500',
      icon: (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      )
    },
    warning: {
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      dotColor: 'bg-amber-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    },
    error: {
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      dotColor: 'bg-red-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    maintenance: {
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      dotColor: 'bg-gray-500',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  }
  
  return configs[status] || configs.operational
}

const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
  switch (direction) {
    case 'up':
      return (
        <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l10-10m0 0V7m0 10h-10" />
        </svg>
      )
    case 'down':
      return (
        <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-10 10M7 7v10h10" />
        </svg>
      )
    case 'neutral':
      return (
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
        </svg>
      )
  }
}

const getStatIcon = (iconType?: 'document' | 'check' | 'dollar' | 'clock') => {
  switch (iconType) {
    case 'document':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    case 'check':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'dollar':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    case 'clock':
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    default:
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
  }
}

const formatStatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    // Format large numbers with abbreviations
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toLocaleString()
  }
  return value
}

export const EnhancedDashboardHeader: React.FC<EnhancedDashboardHeaderProps> = ({
  userName,
  greeting,
  quickStats = [],
  systemStatus = {
    type: 'operational',
    label: 'All systems running smoothly',
    lastUpdated: 'just now'
  },
  primaryAction = {
    label: 'Upload Document',
    href: '/documents/upload'
  },
  secondaryActions = [],
  className
}) => {
  const displayGreeting = greeting || getPersonalizedGreeting(userName)
  const statusConfig = getStatusConfig(systemStatus.type)
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  })

  const defaultUploadIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  )

  return (
    <Card variant="default" padding="none" className={cn("overflow-hidden", className)}>
      <CardContent className="p-0">
        {/* Main Header Section */}
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Greeting */}
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                  {displayGreeting}
                </h1>
                <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 shadow-sm">
                  <div className={cn("w-2 h-2 rounded-full", statusConfig.dotColor)} />
                  <span className="text-xs font-medium text-gray-600">
                    {currentTime}
                  </span>
                </div>
              </div>

              {/* System Status */}
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-2 rounded-lg border",
                statusConfig.bgColor,
                statusConfig.borderColor
              )}>
                <div className={cn("flex items-center justify-center", statusConfig.color)}>
                  {statusConfig.icon}
                </div>
                <div>
                  <div className={cn("text-sm font-medium", statusConfig.color)}>
                    {systemStatus.label}
                  </div>
                  {systemStatus.details && (
                    <div className="text-xs text-gray-500">
                      {systemStatus.details}
                    </div>
                  )}
                </div>
                {systemStatus.lastUpdated && (
                  <>
                    <div className="w-1 h-1 bg-gray-300 rounded-full mx-1" />
                    <span className="text-xs text-gray-400">
                      {systemStatus.lastUpdated}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {secondaryActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  {action.icon}
                  {action.label}
                </Link>
              ))}
              
              <Link
                href={primaryAction.href}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors shadow-sm hover:shadow-md"
              >
                {primaryAction.icon || defaultUploadIcon}
                {primaryAction.label}
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Section */}
        {quickStats.length > 0 && (
          <div className="px-8 py-5 bg-white border-t border-gray-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {quickStats.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600">
                    {getStatIcon(stat.iconType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-light text-gray-900">
                        {formatStatValue(stat.value)}
                      </span>
                      {stat.trend && (
                        <div className="flex items-center gap-1">
                          {getTrendIcon(stat.trend.direction)}
                          {stat.trend.percentage && (
                            <span className={cn(
                              "text-xs font-medium",
                              stat.trend.direction === 'up' ? 'text-emerald-600' :
                              stat.trend.direction === 'down' ? 'text-red-600' : 'text-gray-500'
                            )}>
                              {stat.trend.percentage}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 font-light truncate">
                      {stat.label}
                      {stat.trend?.label && (
                        <span className="text-gray-400 ml-1">
                          • {stat.trend.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

EnhancedDashboardHeader.displayName = 'EnhancedDashboardHeader'