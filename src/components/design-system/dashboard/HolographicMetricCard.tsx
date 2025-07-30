import React, { useCallback, useEffect, useState } from 'react'
import { cn } from '@/src/lib/utils'

export interface MetricData {
  current: number
  velocity: number
  change: number
  accuracy?: number
  avgTime?: number
  avgInvoice?: number
  description: string
}

export interface HolographicMetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card title
   */
  title: string
  /**
   * Metric data to display
   */
  data: MetricData
  /**
   * Icon element to display
   */
  icon: React.ReactNode
  /**
   * Background gradient classes
   */
  gradient?: string
  /**
   * Unique card identifier for mouse tracking
   */
  cardId: string
  /**
   * Click handler
   */
  onCardClick?: () => void
  /**
   * Whether to enable 3D mouse tracking globally
   */
  enableMouseTracking?: boolean
}

interface MousePosition {
  x: number
  y: number
}

export const HolographicMetricCard = React.forwardRef<HTMLDivElement, HolographicMetricCardProps>(({
  title,
  data,
  icon,
  gradient = 'bg-gradient-to-br from-gray-800 to-gray-900',
  cardId,
  onCardClick,
  enableMouseTracking = true,
  className,
  ...props
}, ref) => {
  const [mousePosition, setMousePosition] = useState<MousePosition>({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState<string | null>(null)

  // Mouse tracking for 3D perspective effects
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!enableMouseTracking) return
    
    setMousePosition({
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: (e.clientY / window.innerHeight) * 2 - 1
    })
  }, [enableMouseTracking])

  // Initialize mouse tracking
  useEffect(() => {
    if (!enableMouseTracking) return
    
    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove, enableMouseTracking])

  const isActive = isHovering === cardId
  const perspectiveX = mousePosition.x * (isActive ? 15 : 5)
  const perspectiveY = mousePosition.y * (isActive ? 10 : 3)

  const formatValue = (value: number) => {
    if (title === 'Invoice Value') {
      return `$${(value / 1000).toFixed(0)}k`
    }
    return value.toLocaleString()
  }

  const renderMetricDetails = () => {
    // No additional details needed
    return null
  }

  return (
    <div 
      ref={ref}
      className={cn('group relative cursor-pointer preserve-3d', className)}
      style={{
        transform: `perspective(1000px) rotateX(${perspectiveY}deg) rotateY(${perspectiveX}deg) ${isActive ? 'scale(1.05)' : 'scale(1)'}`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onClick={onCardClick}
      onMouseEnter={() => setIsHovering(cardId)}
      onMouseLeave={() => setIsHovering(null)}
      {...props}
    >
      {/* Holographic border effect */}
      <div className={cn(
        'absolute inset-0 rounded-3xl opacity-20 blur-xl group-hover:opacity-40 transition-opacity duration-500',
        gradient
      )} />
      
      {/* Main card */}
      <div className={cn(
        'relative overflow-hidden rounded-3xl border border-white/20 backdrop-blur-xl',
        gradient
      )}>
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at ${50 + mousePosition.x * 20}% ${50 + mousePosition.y * 20}%, rgba(255,255,255,0.1) 0%, transparent 50%)`
            }}
          />
        </div>
        
        <div className="relative z-10 p-6 flex flex-col h-full">
          {/* Header with icon */}
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all duration-300">
              {icon}
            </div>
          </div>

          {/* Main metric */}
          <div className="space-y-2 flex-1">
            <h3 className="text-white/80 text-sm font-medium tracking-wide uppercase">{title}</h3>
            <div className="flex items-baseline">
              <span className="text-5xl font-bold text-white tracking-tight">
                {formatValue(data.current)}
              </span>
            </div>
            <p className="text-white/60 text-sm">{data.description}</p>
          </div>
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
    </div>
  )
})

HolographicMetricCard.displayName = 'HolographicMetricCard'