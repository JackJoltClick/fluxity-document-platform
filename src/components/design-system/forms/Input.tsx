import React from 'react'
import { cn } from '@/src/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Input variant following Square design philosophy
   */
  variant?: 'default' | 'outlined' | 'filled'
  /**
   * Input size variant
   */
  inputSize?: 'sm' | 'md' | 'lg'
  /**
   * Input state
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
   * Icon to display before input
   */
  icon?: React.ReactNode
  /**
   * Icon to display after input
   */
  iconAfter?: React.ReactNode
  /**
   * Full width input
   */
  fullWidth?: boolean
}

const inputVariants = {
  default: 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
  outlined: 'border-2 border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500',
  filled: 'border-0 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500'
}

const inputSizes = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg'
}

const inputStates = {
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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  variant = 'default',
  inputSize = 'md',
  state = 'default',
  label,
  helperText,
  error,
  success,
  warning,
  required = false,
  icon,
  iconAfter,
  fullWidth = false,
  className,
  id,
  ...props
}, ref) => {
  const generatedId = React.useId()
  const inputId = id || generatedId
  const currentState = error ? 'error' : success ? 'success' : warning ? 'warning' : state
  const message = error || success || warning || helperText

  return (
    <div className={cn('space-y-2', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block font-medium text-gray-900',
            labelSizes[inputSize]
          )}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-xl border font-light transition-colors focus:outline-none focus:ring-1',
            inputVariants[variant],
            inputSizes[inputSize],
            inputStates[currentState],
            icon && 'pl-10',
            iconAfter && 'pr-10',
            className
          )}
          {...props}
        />
        
        {iconAfter && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{iconAfter}</span>
          </div>
        )}
      </div>
      
      {message && (
        <p className={cn(
          'font-light',
          messageSizes[inputSize],
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

Input.displayName = 'Input'