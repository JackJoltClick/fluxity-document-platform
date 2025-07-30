import React, { forwardRef } from 'react'
import { cn } from '@/src/lib/utils'

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Search icon position */
  iconPosition?: 'left' | 'right'
  /** Custom search icon */
  icon?: React.ReactNode
  /** Show clear button when there's input */
  clearable?: boolean
  /** Callback when clear button is clicked */
  onClear?: () => void
  /** Loading state */
  loading?: boolean
  /** Container className */
  containerClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  iconPosition = 'right',
  icon,
  clearable = false,
  onClear,
  loading = false,
  containerClassName,
  className,
  value,
  onChange,
  ...props
}, ref) => {
  const defaultIcon = (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )

  const searchIcon = icon || defaultIcon
  const hasValue = value && String(value).length > 0

  return (
    <div className={cn('relative', containerClassName)}>
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        className={cn(
          'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
          iconPosition === 'left' && 'pl-10',
          iconPosition === 'right' && (clearable && hasValue ? 'pr-16' : 'pr-10'),
          className
        )}
        {...props}
      />
      
      {/* Search Icon */}
      <div className={cn(
        'absolute inset-y-0 flex items-center pointer-events-none text-gray-400',
        iconPosition === 'left' ? 'left-3' : 'right-3'
      )}>
        {loading ? (
          <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
        ) : (
          searchIcon
        )}
      </div>

      {/* Clear Button */}
      {clearable && hasValue && !loading && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'absolute inset-y-0 flex items-center text-gray-400 hover:text-gray-600 transition-colors',
            iconPosition === 'left' ? 'right-8' : 'right-8'
          )}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
})

SearchInput.displayName = 'SearchInput'