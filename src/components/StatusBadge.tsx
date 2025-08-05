import React from 'react'
import { DocumentStatusType } from '@/src/types/document.types'

interface StatusBadgeProps {
  status: DocumentStatusType
  className?: string
}

const statusConfig = {
  pending: {
    label: 'Queued for Processing',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: '⏳'
  },
  processing: {
    label: 'Processing',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: '🔄'
  },
  completed: {
    label: 'Completed',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: '✅'
  },
  failed: {
    label: 'Failed',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    icon: '❌'
  },
  uploaded: {
    label: 'Ready for Processing',
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
    icon: '📄'
  },
  queued: {
    label: 'Queued',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-700',
    borderColor: 'border-indigo-200',
    icon: '📬'
  }
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.uploaded
  
  return (
    <div 
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      data-testid={`status-badge-${status}`}
    >
      {status === 'processing' && (
        <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
      )}
      {status !== 'processing' && (
        <span className="mr-2">{config.icon}</span>
      )}
      {config.label}
    </div>
  )
}

export function CostDisplay({ 
  cost, 
  method, 
  className = '' 
}: { 
  cost: number | null
  method: string | null
  className?: string 
}) {
  if (!cost && !method) return null
  
  return (
    <div className={`text-sm text-gray-600 ${className}`}>
      {cost && (
        <span className="font-medium">
          ${cost.toFixed(4)}
        </span>
      )}
      {cost && method && <span className="mx-2">•</span>}
      {method && (
        <span className="capitalize">
          {method}
        </span>
      )}
    </div>
  )
}

export function ProcessingProgress({ progress }: { progress?: number }) {
  if (typeof progress !== 'number') return null
  
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div 
        className="h-2 rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-blue-500 to-blue-600"
        style={{ 
          width: `${Math.min(Math.max(progress, 0), 100)}%`,
          boxShadow: progress > 0 ? '0 0 8px rgba(59, 130, 246, 0.4)' : 'none'
        }}
      >
        {progress > 20 && (
          <div className="w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        )}
      </div>
    </div>
  )
}

export default StatusBadge