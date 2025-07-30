import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'

export interface NavigationItemProps {
  /** Navigation item label */
  name: string
  /** Navigation item href */
  href: string
  /** Navigation item icon */
  icon?: React.ReactNode
  /** Whether the item is active */
  isActive?: boolean
  /** Custom active check function */
  isActiveCustom?: (pathname: string) => boolean
  /** Custom variant styling */
  variant?: 'default' | 'sidebar' | 'tabs'
  /** Custom className */
  className?: string
  /** Click handler for non-link items */
  onClick?: () => void
  /** Whether to show active indicator */
  showActiveIndicator?: boolean
  /** Custom active indicator */
  activeIndicator?: React.ReactNode
  /** Whether the item is disabled */
  disabled?: boolean
  /** Badge content */
  badge?: React.ReactNode
}

const variantClasses = {
  default: {
    base: 'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
    active: 'bg-indigo-100 text-indigo-700',
    inactive: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  },
  sidebar: {
    base: 'group flex items-center px-5 py-4 text-base font-light rounded-lg transition-all duration-200',
    active: 'bg-gray-900 text-white shadow-md',
    inactive: 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
  },
  tabs: {
    base: 'group flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors',
    active: 'border-indigo-500 text-indigo-600',
    inactive: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
  }
}

export const NavigationItem: React.FC<NavigationItemProps> = ({
  name,
  href,
  icon,
  isActive: isActiveProp,
  isActiveCustom,
  variant = 'default',
  className,
  onClick,
  showActiveIndicator = false,
  activeIndicator,
  disabled = false,
  badge
}) => {
  const pathname = usePathname()
  
  // Determine if item is active
  const isActive = isActiveProp ?? 
    (isActiveCustom ? isActiveCustom(pathname) : pathname === href || pathname.startsWith(href + '/'))

  const classes = variantClasses[variant]
  
  const content = (
    <>
      {icon && (
        <span className={cn(
          'mr-3 transition-colors',
          variant === 'sidebar' && isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600',
          variant !== 'sidebar' && isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
        )}>
          {icon}
        </span>
      )}
      <span className="flex-1 tracking-tight">{name}</span>
      {badge && (
        <span className="ml-2">
          {badge}
        </span>
      )}
      {showActiveIndicator && isActive && (
        <span className="ml-auto">
          {activeIndicator || (
            variant === 'sidebar' ? (
              <div className="w-2 h-2 bg-white rounded-full opacity-80"></div>
            ) : (
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
            )
          )}
        </span>
      )}
    </>
  )

  const baseClassName = cn(
    classes.base,
    isActive ? classes.active : classes.inactive,
    disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
    className
  )

  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={baseClassName}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={baseClassName}
    >
      {content}
    </Link>
  )
}

NavigationItem.displayName = 'NavigationItem'