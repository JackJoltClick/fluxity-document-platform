import React from 'react'
import { cn } from '@/src/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant following Square design philosophy
   */
  variant?: 'primary' | 'secondary' | 'success' | 'premium' | 'ghost' | 'danger' | 'outline'
  /**
   * Button size
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Loading state
   */
  loading?: boolean
  /**
   * Icon to display before text
   */
  icon?: React.ReactNode
  /**
   * Icon to display after text
   */
  iconAfter?: React.ReactNode
  /**
   * Full width button
   */
  fullWidth?: boolean
}

const buttonVariants = {
  primary: 'stripe-button stripe-button-primary',
  secondary: 'stripe-button stripe-button-secondary', 
  success: 'stripe-button stripe-button-success',
  premium: 'stripe-button stripe-button-premium',
  ghost: 'stripe-button stripe-button-ghost',
  danger: 'stripe-button stripe-button-danger',
  outline: 'stripe-button stripe-button-outline'
}

const buttonSizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg'
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconAfter,
  fullWidth = false,
  className,
  children,
  disabled,
  ...props
}, ref) => {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && 'w-full',
        isDisabled && 'opacity-50 cursor-not-allowed',
        'flex items-center justify-center space-x-2',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span>{icon}</span>}
          {children && <span>{children}</span>}
          {iconAfter && <span>{iconAfter}</span>}
        </>
      )}
    </button>
  )
})

Button.displayName = 'Button'