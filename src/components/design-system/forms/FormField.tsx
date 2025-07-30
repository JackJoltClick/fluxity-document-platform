import React from 'react'
import { cn } from '@/src/lib/utils'

export interface FormFieldProps {
  /** Unique identifier for the field */
  id?: string
  /** Field label */
  label?: string
  /** Whether the field is required */
  required?: boolean
  /** Help text to display below the field */
  helpText?: string
  /** Error message to display */
  error?: string
  /** Whether the field is disabled */
  disabled?: boolean
  /** Custom className for the field container */
  className?: string
  /** Custom className for the label */
  labelClassName?: string
  /** The form control element */
  children: React.ReactNode
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required = false,
  helpText,
  error,
  disabled = false,
  className,
  labelClassName,
  children
}) => {
  const hasError = !!error

  return (
    <div className={cn('space-y-1', className)}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={id}
          className={cn(
            'block text-sm font-medium',
            hasError ? 'text-red-700' : 'text-gray-700',
            disabled && 'opacity-50',
            labelClassName
          )}
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Form Control */}
      <div className="relative">
        {children}
      </div>

      {/* Help Text */}
      {helpText && !hasError && (
        <p className={cn(
          'text-sm text-gray-500',
          disabled && 'opacity-50'
        )}>
          {helpText}
        </p>
      )}

      {/* Error Message */}
      {hasError && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

FormField.displayName = 'FormField'

// Enhanced Input component that works with FormField
export interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Whether the input has an error */
  hasError?: boolean
  /** Icon to display on the left */
  leftIcon?: React.ReactNode
  /** Icon to display on the right */
  rightIcon?: React.ReactNode
  /** Input size variant */
  inputSize?: 'sm' | 'md' | 'lg'
}

export const EnhancedInput = React.forwardRef<HTMLInputElement, EnhancedInputProps>(({
  hasError = false,
  leftIcon,
  rightIcon,
  inputSize = 'md',
  className,
  ...props
}, ref) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  }

  return (
    <div className="relative">
      {leftIcon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {leftIcon}
        </div>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors',
          sizeClasses[inputSize],
          hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          props.disabled && 'bg-gray-50 cursor-not-allowed',
          className
        )}
        {...props}
      />
      {rightIcon && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          {rightIcon}
        </div>
      )}
    </div>
  )
})

EnhancedInput.displayName = 'EnhancedInput'

// Enhanced Textarea component
export interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Whether the textarea has an error */
  hasError?: boolean
}

export const EnhancedTextarea = React.forwardRef<HTMLTextAreaElement, EnhancedTextareaProps>(({
  hasError = false,
  className,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors resize-none',
        hasError
          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
        props.disabled && 'bg-gray-50 cursor-not-allowed',
        className
      )}
      {...props}
    />
  )
})

EnhancedTextarea.displayName = 'EnhancedTextarea'