import React from 'react'
import { cn } from '@/src/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant following Square design philosophy
   */
  variant?: 'default' | 'elevated' | 'outlined' | 'ghost'
  /**
   * Card padding size
   */
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  /**
   * Whether card should have hover effects
   */
  hoverable?: boolean
  /**
   * Whether card content should be clickable
   */
  clickable?: boolean
}

const cardVariants = {
  default: 'bg-white border border-gray-200 shadow-sm',
  elevated: 'bg-white border border-gray-100 shadow-md',
  outlined: 'bg-white border-2 border-gray-300',
  ghost: 'bg-gray-50 border border-gray-100'
}

const cardPadding = {
  none: '',
  sm: 'p-4',
  md: 'p-6', 
  lg: 'p-8',
  xl: 'p-12'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'md',
  hoverable = false,
  clickable = false,
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-lg transition-all duration-200',
        cardVariants[variant],
        cardPadding[padding],
        hoverable && 'hover:shadow-md hover:-translate-y-0.5',
        clickable && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

Card.displayName = 'Card'

// Card Header Component
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Whether to include bottom border
   */
  bordered?: boolean
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(({
  bordered = true,
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'px-8 py-6',
        bordered && 'border-b border-gray-100',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

CardHeader.displayName = 'CardHeader'

// Card Content Component
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode
}

export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={cn('p-8', className)}
      {...props}
    >
      {children}
    </div>
  )
})

CardContent.displayName = 'CardContent'

// Card Title Component
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Title level (h1-h6)
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6
}

export const CardTitle = React.forwardRef<HTMLHeadingElement, CardTitleProps>(({
  level = 2,
  className,
  children,
  ...props
}, ref) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements
  
  const titleStyles = {
    1: 'text-4xl font-light',
    2: 'text-2xl font-light', 
    3: 'text-xl font-light',
    4: 'text-lg font-medium',
    5: 'text-base font-medium',
    6: 'text-sm font-medium'
  }

  return React.createElement(Component, {
    ref,
    className: cn(
      'text-gray-900 tracking-tight',
      titleStyles[level],
      className
    ),
    ...props
  }, children)
})

CardTitle.displayName = 'CardTitle'

// Card Description Component
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode
}

export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(({
  className,
  children,
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={cn('text-gray-500 font-light mt-2', className)}
      {...props}
    >
      {children}
    </p>
  )
})

CardDescription.displayName = 'CardDescription'