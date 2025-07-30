import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/design-system/layout/Card'
import { Button } from '@/src/components/design-system/foundations/Button'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'

interface ActivityItem {
  id: string
  type: 'document_uploaded' | 'document_processed' | 'document_exported' | 'vendor_created'
  title: string
  subtitle: string
  timestamp: string
  metadata?: {
    amount?: number
    status?: string
    vendor?: string
    filename?: string
  }
  href?: string
}

interface RecentActivityCardProps {
  activities: ActivityItem[]
  isLoading?: boolean
  className?: string
}

const getActivityIcon = (type: ActivityItem['type']) => {
  const iconClasses = "w-5 h-5 shrink-0"
  
  switch (type) {
    case 'document_uploaded':
      return (
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <svg className={cn(iconClasses, "text-blue-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      )
    case 'document_processed':
      return (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <svg className={cn(iconClasses, "text-emerald-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
    case 'document_exported':
      return (
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
          <svg className={cn(iconClasses, "text-purple-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )
    case 'vendor_created':
      return (
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <svg className={cn(iconClasses, "text-amber-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
          <svg className={cn(iconClasses, "text-gray-600")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      )
  }
}

const formatAmount = (amount?: number) => {
  if (!amount) return null
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const ActivityItemComponent: React.FC<{ activity: ActivityItem; onItemClick?: (activity: ActivityItem) => void }> = ({ 
  activity, 
  onItemClick 
}) => {
  const handleClick = () => {
    if (onItemClick) {
      onItemClick(activity)
    }
  }

  const content = (
    <div className="group flex items-start gap-4 p-4 hover:bg-gray-25 transition-all duration-200 rounded-lg cursor-pointer">
      {getActivityIcon(activity.type)}
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
            {activity.title}
          </h4>
          <span className="text-xs text-gray-400 shrink-0 ml-4">
            {activity.timestamp}
          </span>
        </div>
        
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          {activity.subtitle}
        </p>
        
        {activity.metadata?.amount && (
          <div className="mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
              {formatAmount(activity.metadata.amount)}
            </span>
          </div>
        )}
      </div>
      
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  )

  if (activity.href) {
    return (
      <Link href={activity.href} className="block">
        {content}
      </Link>
    )
  }

  return (
    <div onClick={handleClick}>
      {content}
    </div>
  )
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({
  activities,
  isLoading = false,
  className
}) => {
  return (
    <Card variant="default" padding="none" className={cn("overflow-hidden", className)}>
      <CardHeader className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle level={3} className="text-gray-900">
              Recent Activity
            </CardTitle>
            <p className="text-sm text-gray-500 mt-1 font-light">
              Stay updated with your latest document processing
            </p>
          </div>
          <Link 
            href="/documents"
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors rounded-md hover:bg-gray-50"
          >
            View all
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {isLoading ? (
          <div className="px-6 py-8">
            <LoadingState 
              size="sm" 
              message="Loading recent activity..." 
              variant="dots"
            />
          </div>
        ) : activities.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2">No recent activity</h3>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto leading-relaxed">
              Upload your first document or create a vendor to see activity here
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/documents/upload"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Document
              </Link>
              <Link
                href="/vendors"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Manage Vendors
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {activities.map((activity) => (
              <ActivityItemComponent
                key={activity.id}
                activity={activity}
                onItemClick={(activity) => {
                  if (activity.href) {
                    window.location.href = activity.href
                  }
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

RecentActivityCard.displayName = 'RecentActivityCard'