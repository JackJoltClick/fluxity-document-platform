import React from 'react'
import { cn } from '@/src/lib/utils'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'

type AccountingStatus = 'needs_mapping' | 'ready_for_export' | 'exported'

export interface AccountingStatusBadgeProps {
  status: AccountingStatus
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

const statusConfig = {
  needs_mapping: {
    label: 'Needs Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: ExclamationTriangleIcon,
    description: 'Document requires manual review of accounting fields'
  },
  ready_for_export: {
    label: 'Ready for Export',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircleIcon,
    description: 'All accounting fields are validated and ready for export'
  },
  exported: {
    label: 'Exported',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CloudArrowUpIcon,
    description: 'Document has been exported to accounting system'
  }
}

const sizeClasses = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5'
}

const iconSizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5'
}

export const AccountingStatusBadge: React.FC<AccountingStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className
}) => {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        config.color,
        sizeClasses[size],
        className
      )}
      title={config.description}
    >
      {showIcon && (
        <Icon className={cn('mr-1', iconSizeClasses[size])} />
      )}
      {config.label}
    </span>
  )
}

// Export status configuration for use in other components
export { statusConfig, type AccountingStatus }