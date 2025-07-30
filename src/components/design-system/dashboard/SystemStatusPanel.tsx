import React from 'react'
import { cn } from '@/src/lib/utils'
import { StatusIndicator } from '../feedback/StatusIndicator'

export interface SystemService {
  name: string
  status: 'operational' | 'processing' | 'warning' | 'error' | 'offline'
  label?: string
}

export interface SystemMetric {
  name: string
  value: string | number
  unit?: string
  progress?: number
  max?: number
}

export interface SystemStatusPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Panel title
   */
  title?: string
  /**
   * System services to display
   */
  services?: SystemService[]
  /**
   * System metrics to display
   */
  metrics?: SystemMetric[]
  /**
   * Compact mode (smaller spacing)
   */
  compact?: boolean
}

const defaultServices: SystemService[] = [
  { name: 'Processing Engine', status: 'operational', label: 'Operational' },
  { name: 'AI Service', status: 'operational', label: 'Online' },
  { name: 'Database', status: 'operational', label: 'Connected' }
]

const defaultMetrics: SystemMetric[] = [
  { name: 'Storage Usage', value: 68, unit: '%', progress: 68, max: 100 },
  { name: 'API Calls Today', value: '12.4k', unit: 'requests' },
  { name: 'Uptime', value: '99.9', unit: '%' }
]

export const SystemStatusPanel = React.forwardRef<HTMLDivElement, SystemStatusPanelProps>(({
  title = 'System Status',
  services = defaultServices,
  metrics = defaultMetrics,
  compact = false,
  className,
  ...props
}, ref) => {
  const formatValue = (value: string | number, unit?: string) => {
    if (typeof value === 'number' && unit === '%') {
      return `${value}%`
    }
    return unit ? `${value} ${unit}` : value.toString()
  }

  const renderProgressBar = (progress: number, max: number = 100) => {
    const percentage = (progress / max) * 100
    const colorClass = percentage > 80 ? 'bg-indigo-600' : percentage > 60 ? 'bg-indigo-500' : 'bg-indigo-400'
    
    return (
      <div className="w-full bg-gray-100 rounded-full h-3 mt-2">
        <div 
          className={cn('h-3 rounded-full transition-all duration-300', colorClass)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(
        'bg-white rounded-lg border border-gray-200 shadow-sm',
        compact ? 'p-6' : 'p-8',
        className
      )}
      {...props}
    >
      <h3 className={cn(
        'font-light text-gray-900 tracking-tight',
        compact ? 'text-xl mb-4' : 'text-2xl mb-6'
      )}>
        {title}
      </h3>
      
      {/* Services Status */}
      {services.length > 0 && (
        <div className={cn('space-y-4', compact ? 'mb-4' : 'mb-6')}>
          {services.map((service, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-600 font-light">{service.name}</span>
              <StatusIndicator 
                status={service.status}
                variant="dot"
                animated={service.status === 'operational' || service.status === 'processing'}
                label={service.label}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* System Metrics */}
      {metrics.length > 0 && (
        <div className="space-y-4">
          {metrics.map((metric, index) => (
            <div key={index}>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-light">{metric.name}</span>
                <span className={cn(
                  'font-medium text-gray-900',
                  compact ? 'text-sm' : 'text-base'
                )}>
                  {formatValue(metric.value, metric.unit)}
                </span>
              </div>
              
              {metric.progress !== undefined && metric.max && (
                renderProgressBar(metric.progress, metric.max)
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

SystemStatusPanel.displayName = 'SystemStatusPanel'