import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'
import { StatusIndicator } from '../feedback/StatusIndicator'
import { AccountingStatusBadge } from '@/src/components/accounting/AccountingStatusBadge'
import { ConfidenceIndicator } from '@/src/components/accounting/ConfidenceIndicator'
import { CheckCircleIcon } from '@heroicons/react/24/outline'

type AccountingStatus = 'needs_mapping' | 'ready_for_export' | 'exported'

export interface DocumentCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Document information
   */
  document: {
    id: string | number
    filename: string
    source?: 'email' | 'upload'
    created_at: string
    status: 'processed' | 'pending' | 'processing' | 'error' | 'completed' | 'failed' | 'uploaded' | 'queued'
    extraction_cost?: number
    extraction_method?: string
    email_metadata?: {
      sender?: string
      subject?: string
      original_filename?: string
    }
    // Accounting fields
    accounting_status?: AccountingStatus
    mapping_confidence?: number
    company_code?: string
    gl_account?: string
    requires_review?: boolean
  }
  /**
   * Custom icon
   */
  icon?: React.ReactNode
  /**
   * Click handler for the card
   */
  onCardClick?: (document: any) => void
  /**
   * Additional actions
   */
  actions?: Array<{
    label: string
    href?: string
    onClick?: () => void | Promise<void>
    variant?: 'primary' | 'secondary'
    disabled?: boolean
  }>
}

const defaultDocumentIcon = (
  <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
)

const statusMapping = {
  processed: 'success' as const,
  pending: 'warning' as const,
  processing: 'processing' as const,
  error: 'error' as const,
  completed: 'success' as const,
  failed: 'error' as const,
  uploaded: 'operational' as const
}

export const DocumentCard = React.forwardRef<HTMLDivElement, DocumentCardProps>(({
  document,
  icon,
  onCardClick,
  actions = [],
  className,
  ...props
}, ref) => {
  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick(document)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatCost = (cost?: number, method?: string) => {
    if (!cost) return null
    return {
      display: `$${cost.toFixed(4)}`,
      method: method || 'Unknown'
    }
  }

  const costInfo = formatCost(document.extraction_cost, document.extraction_method)
  
  // Check if document is export ready
  const isExportReady = document.accounting_status === 'ready_for_export'
  const hasAccountingData = document.status === 'completed' && (document.accounting_status || document.mapping_confidence !== undefined)

  // Default actions
  const defaultActions = [
    {
      label: 'View Details',
      href: `/documents/${document.id}`,
      variant: 'primary' as const
    }
  ]

  const displayActions = actions.length > 0 ? actions : defaultActions

  return (
    <div
      ref={ref}
      className={cn(
        'p-8 hover:bg-gray-25 transition-colors group cursor-pointer',
        className
      )}
      onClick={handleCardClick}
      {...props}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6 flex-1">
          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
            {icon || defaultDocumentIcon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-4 mb-2">
              <h3 className="text-lg font-medium text-gray-900 group-hover:text-gray-700 transition-colors truncate">
                {document.filename}
              </h3>
              
              {document.source && (
                <span className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0',
                  document.source === 'email' 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : 'bg-gray-50 text-gray-700 border-gray-200'
                )}>
                  {document.source === 'email' ? '📧 Email' : '📤 Upload'}
                </span>
              )}

              {isExportReady && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 flex-shrink-0">
                  <CheckCircleIcon className="w-3 h-3 mr-1" />
                  Export Ready
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span className="font-light">
                {document.source === 'email' ? 'Received' : 'Uploaded'} {formatDate(document.created_at)}
              </span>
              
              {document.source === 'email' && document.email_metadata?.sender && (
                <span className="font-light truncate">
                  From: {document.email_metadata.sender}
                </span>
              )}
              
              {costInfo && (
                <span className="font-light text-green-600 flex-shrink-0">
                  {costInfo.display} ({costInfo.method})
                </span>
              )}
            </div>

            {/* Accounting Information Row */}
            {hasAccountingData && (
              <div className="flex items-center space-x-4 mt-2">
                {document.mapping_confidence !== undefined && (
                  <ConfidenceIndicator 
                    confidence={document.mapping_confidence} 
                    variant="dot" 
                    size="sm"
                    showTooltip={false}
                  />
                )}
                
                {document.company_code && (
                  <span className="text-xs text-gray-500">
                    Company: <span className="font-medium text-gray-700">{document.company_code}</span>
                  </span>
                )}
                
                {document.gl_account && (
                  <span className="text-xs text-gray-500">
                    GL: <span className="font-medium text-gray-700">{document.gl_account}</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-6 flex-shrink-0">
          <div className="flex flex-col items-end space-y-2">
            <StatusIndicator 
              status={statusMapping[document.status as keyof typeof statusMapping] || 'operational'}
              variant="badge"
              animated={document.status === 'processing'}
            />
            
            {document.accounting_status && (
              <AccountingStatusBadge 
                status={document.accounting_status} 
                size="sm"
              />
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {displayActions.map((action, index) => {
              if ('href' in action && action.href) {
                return (
                  <Link
                    key={index}
                    href={action.href}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      action.variant === 'primary' 
                        ? 'text-blue-600 hover:text-blue-700'
                        : 'text-gray-600 hover:text-gray-900'
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {action.label}
                  </Link>
                )
              } else {
                return (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation()
                      if ('onClick' in action && action.onClick) {
                        action.onClick()
                      }
                    }}
                    disabled={'disabled' in action ? action.disabled : false}
                    className={cn(
                      'text-sm font-medium transition-colors',
                      ('disabled' in action && action.disabled)
                        ? 'text-gray-400 cursor-not-allowed'
                        : action.variant === 'primary' 
                          ? 'text-blue-600 hover:text-blue-700'
                          : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    {action.label}
                  </button>
                )
              }
            })}
          </div>
        </div>
      </div>
    </div>
  )
})

DocumentCard.displayName = 'DocumentCard'