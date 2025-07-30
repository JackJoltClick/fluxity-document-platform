import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { StatusIndicator } from '../feedback/StatusIndicator'

export interface DocumentListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Document information
   */
  document: {
    id: string | number
    name: string
    vendor: string
    amount?: number
    status: 'processed' | 'pending' | 'processing' | 'error'
    date: string
  }
  /**
   * Whether the item is clickable/linkable
   */
  clickable?: boolean
  /**
   * Link href when clickable
   */
  href?: string
  /**
   * Custom icon for the document
   */
  icon?: React.ReactNode
  /**
   * Click handler
   */
  onItemClick?: (document: any) => void
}

const defaultDocumentIcon = (
  <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
)

const statusConfig = {
  processed: 'success' as const,
  pending: 'warning' as const,
  processing: 'processing' as const,
  error: 'error' as const,
  completed: 'success' as const,
  uploaded: 'warning' as const,
  failed: 'error' as const
}

export const DocumentListItem = React.forwardRef<HTMLDivElement, DocumentListItemProps>(({
  document,
  clickable = true,
  href,
  icon,
  onItemClick,
  className,
  ...props
}, ref) => {
  const itemHref = href || (clickable ? `/documents/${document.id}` : undefined)
  
  const handleClick = () => {
    if (onItemClick) {
      onItemClick(document)
    }
  }

  const formatAmount = (amount?: number) => {
    if (!amount) return null
    return `$${amount.toLocaleString()}`
  }

  const content = (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-5">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
          {icon || defaultDocumentIcon}
        </div>
        <div>
          <p className="font-medium text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
            {document.name}
          </p>
          <p className="text-gray-500 mt-1">
            {document.vendor}
            {document.amount && (
              <>
                <span className="mx-2">•</span>
                {formatAmount(document.amount)}
              </>
            )}
          </p>
        </div>
      </div>
      <div className="text-right space-y-2">
        <StatusIndicator 
          status={statusConfig[document.status] || 'warning'} 
          variant="badge"
          animated={document.status === 'processing'}
        />
        <p className="text-xs text-gray-400">{document.date}</p>
      </div>
    </div>
  )

  const baseClasses = cn(
    'px-6 py-4 transition-colors group',
    clickable && 'hover:bg-gray-25 cursor-pointer',
    className
  )

  if (itemHref && clickable) {
    return (
      <Link
        href={itemHref}
        className={baseClasses}
      >
        {content}
      </Link>
    )
  }

  return (
    <div
      ref={ref}
      className={baseClasses}
      onClick={clickable ? handleClick : undefined}
      {...props}
    >
      {content}
    </div>
  )
})

DocumentListItem.displayName = 'DocumentListItem'