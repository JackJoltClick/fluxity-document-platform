import React from 'react'
import { cn } from '@/src/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /**
   * Select variant following Square design philosophy
   */
  variant?: 'default' | 'outlined' | 'filled'
  /**
   * Select size variant
   */
  selectSize?: 'sm' | 'md' | 'lg'
  /**
   * Select state
   */
  state?: 'default' | 'error' | 'success' | 'warning'
  /**
   * Label text
   */
  label?: string
  /**
   * Helper text
   */
  helperText?: string
  /**
   * Error message
   */
  error?: string
  /**
   * Success message
   */
  success?: string
  /**
   * Warning message
   */
  warning?: string
  /**
   * Required indicator
   */
  required?: boolean
  /**
   * Placeholder text
   */
  placeholder?: string
  /**
   * Select options
   */
  options?: SelectOption[]
  /**
   * Full width select
   */
  fullWidth?: boolean
}

const selectVariants = {
  default: 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
  outlined: 'border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
  filled: 'border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500'
}

const selectSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg'
}

const selectStates = {
  default: 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error: 'border-red-300 focus:border-red-500 focus:ring-red-500',
  success: 'border-green-300 focus:border-green-500 focus:ring-green-500',
  warning: 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
}

const labelSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base'
}

const messageSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-sm'
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  variant = 'default',
  selectSize = 'md',
  state = 'default',
  label,
  helperText,
  error,
  success,
  warning,
  required = false,
  placeholder,
  options = [],
  fullWidth = false,
  className,
  id,
  children,
  ...props
}, ref) => {
  const generatedId = React.useId()
  const selectId = id || generatedId
  const currentState = error ? 'error' : success ? 'success' : warning ? 'warning' : state
  const message = error || success || warning || helperText

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            'block font-medium text-gray-900',
            labelSizes[selectSize]
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'block w-full rounded-xl border font-light transition-colors focus:outline-none focus:ring-1 appearance-none bg-no-repeat bg-right pr-10',
            'bg-[url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")]',
            selectVariants[variant],
            selectSizes[selectSize],
            selectStates[currentState],
            className
          )}
          style={{ backgroundSize: '1.5rem 1.5rem', backgroundPosition: 'right 0.75rem center' }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
          
          {children}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
      
      {message && (
        <p className={cn(
          'font-light',
          messageSizes[selectSize],
          error && 'text-red-600',
          success && 'text-green-600',
          warning && 'text-amber-600',
          !error && !success && !warning && 'text-gray-500'
        )}>
          {message}
        </p>
      )}
    </div>
  )
})

Select.displayName = 'Select'