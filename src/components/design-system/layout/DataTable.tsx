import React from 'react'
import { cn } from '@/src/lib/utils'

export interface DataTableColumn<T> {
  /** Unique key for the column */
  key: string
  /** Column header label */
  label: string
  /** Function to render the cell content */
  render: (item: T) => React.ReactNode
  /** CSS class for the column */
  className?: string
  /** Whether the column is sortable */
  sortable?: boolean
}

export interface DataTableAction<T> {
  /** Unique key for the action */
  key: string
  /** Action label */
  label: string
  /** Function to handle the action */
  onClick: (item: T) => void
  /** Optional color variant */
  variant?: 'default' | 'primary' | 'danger'
  /** Whether the action is disabled */
  disabled?: (item: T) => boolean
  /** Optional icon */
  icon?: React.ReactNode
}

export interface DataTableProps<T> {
  /** Array of data items */
  data: T[]
  /** Column definitions */
  columns: DataTableColumn<T>[]
  /** Action buttons for each row */
  actions?: DataTableAction<T>[]
  /** Function to get unique key for each item */
  getRowKey: (item: T) => string
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Empty state icon */
  emptyIcon?: React.ReactNode
  /** Table caption/title */
  caption?: string
  /** CSS class for the table container */
  className?: string
  /** Row hover effect */
  hoverable?: boolean
}

export function DataTable<T>({
  data,
  columns,
  actions,
  getRowKey,
  loading = false,
  emptyMessage = 'No data available',
  emptyIcon = '📄',
  caption,
  className,
  hoverable = true
}: DataTableProps<T>) {
  const getActionVariantClasses = (variant: DataTableAction<T>['variant'] = 'default') => {
    switch (variant) {
      case 'primary':
        return 'text-indigo-600 hover:text-indigo-900'
      case 'danger':
        return 'text-red-600 hover:text-red-900'
      default:
        return 'text-gray-600 hover:text-gray-900'
    }
  }

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg shadow', className)}>
        {caption && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{caption}</h2>
          </div>
        )}
        <div className="p-8">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-4 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
            <p className="text-gray-600">Please wait while we fetch your data</p>
          </div>
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg shadow', className)}>
        {caption && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">{caption}</h2>
          </div>
        )}
        <div className="p-8">
          <div className="text-center py-12">
            <span className="text-6xl">{emptyIcon}</span>
            <h3 className="text-lg font-medium text-gray-900 mt-4">{emptyMessage}</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-lg shadow overflow-hidden', className)}>
      {caption && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">{caption}</h2>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    column.className
                  )}
                >
                  {column.label}
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((item) => (
              <tr
                key={getRowKey(item)}
                className={cn(
                  hoverable && 'hover:bg-gray-50 transition-colors'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-6 py-4 whitespace-nowrap text-sm',
                      column.className
                    )}
                  >
                    {column.render(item)}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-3">
                      {actions.map((action) => {
                        const isDisabled = action.disabled?.(item) || false
                        return (
                          <button
                            key={action.key}
                            onClick={() => !isDisabled && action.onClick(item)}
                            disabled={isDisabled}
                            className={cn(
                              'font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                              getActionVariantClasses(action.variant)
                            )}
                          >
                            <div className="flex items-center space-x-1">
                              {action.icon && <span>{action.icon}</span>}
                              <span>{action.label}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

DataTable.displayName = 'DataTable'