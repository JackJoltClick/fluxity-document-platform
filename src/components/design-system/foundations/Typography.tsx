import React from 'react'
import { cn } from '@/src/lib/utils'

// Heading Component
export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  /**
   * Heading level (h1-h6)
   */
  level?: 1 | 2 | 3 | 4 | 5 | 6
  /**
   * Typography variant following Square design philosophy
   */
  variant?: 'display' | 'heading' | 'subheading' | 'title'
  /**
   * Text color
   */
  color?: 'primary' | 'secondary' | 'muted' | 'disabled'
  /**
   * Font weight
   */
  weight?: 'light' | 'normal' | 'medium' | 'semibold'
}

const headingStyles = {
  display: {
    1: 'text-5xl font-light tracking-tight',
    2: 'text-4xl font-light tracking-tight',
    3: 'text-3xl font-light tracking-tight',
    4: 'text-2xl font-light tracking-tight',
    5: 'text-xl font-light tracking-tight',
    6: 'text-lg font-light tracking-tight'
  },
  heading: {
    1: 'text-4xl font-light tracking-tight',
    2: 'text-3xl font-light tracking-tight', 
    3: 'text-2xl font-light tracking-tight',
    4: 'text-xl font-medium',
    5: 'text-lg font-medium',
    6: 'text-base font-medium'
  },
  subheading: {
    1: 'text-3xl font-normal',
    2: 'text-2xl font-normal',
    3: 'text-xl font-normal',
    4: 'text-lg font-normal',
    5: 'text-base font-normal', 
    6: 'text-sm font-normal'
  },
  title: {
    1: 'text-2xl font-medium',
    2: 'text-xl font-medium',
    3: 'text-lg font-medium',
    4: 'text-base font-medium',
    5: 'text-sm font-medium',
    6: 'text-xs font-medium uppercase tracking-wider'
  }
}

const textColors = {
  primary: 'text-gray-900',
  secondary: 'text-gray-700',
  muted: 'text-gray-500',
  disabled: 'text-gray-400'
}

const fontWeights = {
  light: 'font-light',
  normal: 'font-normal', 
  medium: 'font-medium',
  semibold: 'font-semibold'
}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(({
  level = 2,
  variant = 'heading',
  color = 'primary',
  weight,
  className,
  children,
  ...props
}, ref) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements
  
  return React.createElement(Component, {
    ref,
    className: cn(
      headingStyles[variant][level],
      textColors[color],
      weight && fontWeights[weight],
      className
    ),
    ...props
  }, children)
})

Heading.displayName = 'Heading'

// Text Component
export interface TextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * Text size
   */
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  /**
   * Text color
   */
  color?: 'primary' | 'secondary' | 'muted' | 'disabled'
  /**
   * Font weight
   */
  weight?: 'light' | 'normal' | 'medium' | 'semibold'
  /**
   * Text element type
   */
  as?: 'p' | 'span' | 'div' | 'label'
}

const textSizes = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg', 
  xl: 'text-xl'
}

export const Text = React.forwardRef<HTMLElement, TextProps>(({
  size = 'base',
  color = 'secondary',
  weight = 'normal',
  as = 'p',
  className,
  children,
  ...props
}, ref) => {
  const Component = as
  
  return React.createElement(Component, {
    ref,
    className: cn(
      textSizes[size],
      textColors[color],
      fontWeights[weight],
      'leading-relaxed',
      className
    ),
    ...props
  }, children)
})

Text.displayName = 'Text'

// Label Component
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Label size
   */
  size?: 'sm' | 'base' | 'lg'
  /**
   * Required indicator
   */
  required?: boolean
}

const labelSizes = {
  sm: 'text-xs',
  base: 'text-sm',
  lg: 'text-base'
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({
  size = 'base',
  required = false,
  className,
  children,
  ...props
}, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        'block font-medium text-gray-900 mb-2',
        labelSizes[size],
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )
})

Label.displayName = 'Label'

// Caption Component
export interface CaptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  /**
   * Caption variant
   */
  variant?: 'default' | 'error' | 'success' | 'warning'
}

const captionVariants = {
  default: 'text-gray-500',
  error: 'text-red-600',
  success: 'text-green-600', 
  warning: 'text-amber-600'
}

export const Caption = React.forwardRef<HTMLParagraphElement, CaptionProps>(({
  variant = 'default',
  className,
  children,
  ...props
}, ref) => {
  return (
    <p
      ref={ref}
      className={cn(
        'text-sm font-light leading-relaxed',
        captionVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </p>
  )
})

Caption.displayName = 'Caption'