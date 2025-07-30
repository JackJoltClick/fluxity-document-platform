import React from 'react'
import { cn } from '@/src/lib/utils'

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Alert variant */
  variant?: 'info' | 'success' | 'warning' | 'error'
  /** Alert title */
  title?: string
  /** Whether to show dismiss button */
  dismissible?: boolean
  /** Dismiss handler */
  onDismiss?: () => void
  /** Custom icon */
  icon?: React.ReactNode
  /** Whether to show default icon */
  showIcon?: boolean
  /** Alert size */
  size?: 'sm' | 'md' | 'lg'
  /** Children content */
  children?: React.ReactNode
}

const variantConfig = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    content: 'text-blue-700',
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    )
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-green-400',
    title: 'text-green-800',
    content: 'text-green-700',
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    )
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    content: 'text-yellow-700',
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    )
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-red-400',
    title: 'text-red-800',
    content: 'text-red-700',
    defaultIcon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )
  }
}

const sizeConfig = {
  sm: {
    container: 'p-3',
    icon: 'w-4 h-4',
    title: 'text-sm font-medium',
    content: 'text-sm'
  },
  md: {
    container: 'p-4',
    icon: 'w-5 h-5',
    title: 'text-sm font-medium',
    content: 'text-sm'
  },
  lg: {
    container: 'p-6',
    icon: 'w-6 h-6',
    title: 'text-base font-medium',
    content: 'text-sm'
  }
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  dismissible = false,
  onDismiss,
  icon,
  showIcon = true,
  size = 'md',
  children,
  className,
  ...props
}) => {
  const config = variantConfig[variant]
  const sizeStyles = sizeConfig[size]
  const displayIcon = icon || (showIcon ? config.defaultIcon : null)

  return (
    <div
      className={cn(
        'rounded-lg border',
        config.container,
        sizeStyles.container,
        className
      )}
      role="alert"
      {...props}
    >
      <div className="flex">
        {displayIcon && (
          <div className="flex-shrink-0">
            <div className={cn(config.icon, sizeStyles.icon)}>
              {displayIcon}
            </div>
          </div>
        )}
        <div className={cn('flex-1', displayIcon && 'ml-3')}>
          {title && (
            <h3 className={cn(config.title, sizeStyles.title, children && 'mb-1')}>
              {title}
            </h3>
          )}
          {children && (
            <div className={cn(config.content, sizeStyles.content)}>
              {children}
            </div>
          )}
        </div>
        {dismissible && onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onDismiss}
                className={cn(
                  'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors',
                  config.icon,
                  'hover:bg-black hover:bg-opacity-10 focus:ring-offset-2'
                )}
                aria-label="Dismiss"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

Alert.displayName = 'Alert'

// Toast component for notifications
export interface ToastProps extends Omit<AlertProps, 'dismissible' | 'size'> {
  /** Auto dismiss duration in milliseconds */
  duration?: number
  /** Position of the toast */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export const Toast: React.FC<ToastProps> = ({
  duration = 5000,
  position = 'top-right',
  onDismiss,
  ...alertProps
}) => {
  React.useEffect(() => {
    if (duration > 0 && onDismiss) {
      const timer = setTimeout(onDismiss, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onDismiss])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  }

  return (
    <div className={cn('fixed z-50 max-w-sm w-full', positionClasses[position])}>
      <Alert
        {...alertProps}
        dismissible={true}
        onDismiss={onDismiss}
        size="md"
        className={cn('shadow-sm', alertProps.className)}
      />
    </div>
  )
}

Toast.displayName = 'Toast'