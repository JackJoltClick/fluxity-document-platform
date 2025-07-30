import React from 'react'
import Link from 'next/link'
import { cn } from '@/src/lib/utils'

export interface QuickActionCardProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Action title
   */
  title: string
  /**
   * Action description
   */
  description: string
  /**
   * Icon or emoji to display
   */
  icon: React.ReactNode | string
  /**
   * Link destination
   */
  href: string
  /**
   * Whether to use external link
   */
  external?: boolean
  /**
   * Custom click handler
   */
  onActionClick?: () => void
}

export const QuickActionCard = React.forwardRef<HTMLAnchorElement, QuickActionCardProps>(({
  title,
  description,
  icon,
  href,
  external = false,
  onActionClick,
  className,
  ...props
}, ref) => {
  const handleClick = () => {
    if (onActionClick) {
      onActionClick()
    }
  }

  const iconElement = typeof icon === 'string' ? (
    <span className="text-2xl opacity-60 group-hover:opacity-80 transition-opacity">
      {icon}
    </span>
  ) : (
    <div className="opacity-60 group-hover:opacity-80 transition-opacity">
      {icon}
    </div>
  )

  const linkProps = external ? {
    target: '_blank',
    rel: 'noopener noreferrer'
  } : {}

  return (
    <Link
      ref={ref}
      href={href}
      onClick={handleClick}
      className={cn(
        'flex items-center p-5 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200 group',
        className
      )}
      {...linkProps}
      {...props}
    >
      <div className="mr-4">
        {iconElement}
      </div>
      <div className="flex-grow">
        <p className="font-medium text-gray-900 text-lg group-hover:text-gray-700 transition-colors">
          {title}
        </p>
        <p className="text-gray-500 mt-1">
          {description}
        </p>
      </div>
      <svg 
        className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
})

QuickActionCard.displayName = 'QuickActionCard'