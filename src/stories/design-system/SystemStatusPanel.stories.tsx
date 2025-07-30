import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { SystemStatusPanel } from '../../components/design-system/dashboard/SystemStatusPanel'

const healthyServices = [
  { name: 'Processing Engine', status: 'operational' as const, label: 'Operational' },
  { name: 'AI Service', status: 'operational' as const, label: 'Online' },
  { name: 'Database', status: 'operational' as const, label: 'Connected' }
]

const mixedServices = [
  { name: 'Processing Engine', status: 'operational' as const, label: 'Operational' },
  { name: 'AI Service', status: 'processing' as const, label: 'Processing' },
  { name: 'Database', status: 'warning' as const, label: 'Slow Response' },
  { name: 'File Storage', status: 'error' as const, label: 'Unavailable' }
]

const systemMetrics = [
  { name: 'Storage Usage', value: 68, unit: '%', progress: 68, max: 100 },
  { name: 'Memory Usage', value: 45, unit: '%', progress: 45, max: 100 },
  { name: 'CPU Usage', value: 23, unit: '%', progress: 23, max: 100 }
]

const businessMetrics = [
  { name: 'API Calls Today', value: '12.4k', unit: 'requests' },
  { name: 'Documents Processed', value: '1,247', unit: 'files' },
  { name: 'Uptime', value: '99.9', unit: '%' },
  { name: 'Processing Speed', value: '2.3', unit: 'sec/doc' }
]

const meta: Meta<typeof SystemStatusPanel> = {
  title: 'Design System/Dashboard/SystemStatusPanel',
  component: SystemStatusPanel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'System status panel component for displaying service health and system metrics following Square design philosophy.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Panel title'
    },
    compact: {
      control: 'boolean',
      description: 'Compact mode with smaller spacing'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default status panel
export const Default: Story = {
  args: {
    title: 'System Status'
  }
}

// All healthy services
export const HealthyServices: Story = {
  args: {
    title: 'System Status',
    services: healthyServices,
    metrics: systemMetrics
  }
}

// Mixed service states
export const MixedStates: Story = {
  args: {
    title: 'System Health',
    services: mixedServices,
    metrics: systemMetrics
  }
}

// Business metrics focus
export const BusinessMetrics: Story = {
  args: {
    title: 'Performance Metrics',
    services: healthyServices.slice(0, 2),
    metrics: businessMetrics
  }
}

// Compact mode
export const CompactMode: Story = {
  args: {
    title: 'Status',
    services: healthyServices,
    metrics: systemMetrics.slice(0, 2),
    compact: true
  }
}

// Services only
export const ServicesOnly: Story = {
  args: {
    title: 'Service Status',
    services: mixedServices,
    metrics: []
  }
}

// Metrics only
export const MetricsOnly: Story = {
  args: {
    title: 'System Resources',
    services: [],
    metrics: systemMetrics
  }
}

// High usage warning
export const HighUsage: Story = {
  args: {
    title: 'Resource Usage',
    services: [
      { name: 'Processing Engine', status: 'warning', label: 'High Load' },
      { name: 'Database', status: 'operational', label: 'Normal' }
    ],
    metrics: [
      { name: 'Storage Usage', value: 89, unit: '%', progress: 89, max: 100 },
      { name: 'Memory Usage', value: 78, unit: '%', progress: 78, max: 100 },
      { name: 'CPU Usage', value: 92, unit: '%', progress: 92, max: 100 }
    ]
  }
}

// Dashboard sidebar example
export const DashboardSidebar: Story = {
  render: () => (
    <div className="space-y-8 max-w-sm">
      <SystemStatusPanel
        title="System Status"
        services={[
          { name: 'Processing Engine', status: 'operational', label: 'Operational' },
          { name: 'AI Service', status: 'processing', label: 'Processing' },
          { name: 'Database', status: 'operational', label: 'Connected' }
        ]}
        metrics={[
          { name: 'Storage Usage', value: 68, unit: '%', progress: 68, max: 100 },
          { name: 'Active Users', value: '24', unit: 'online' },
          { name: 'Queue Length', value: '12', unit: 'documents' }
        ]}
      />
      
      <SystemStatusPanel
        title="Performance"
        compact
        services={[]}
        metrics={[
          { name: 'Avg Response Time', value: '125', unit: 'ms' },
          { name: 'Success Rate', value: '99.2', unit: '%' },
          { name: 'Error Rate', value: '0.8', unit: '%' }
        ]}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Real-time updates example
export const RealTimeUpdates: Story = {
  render: () => {
    const [metrics, setMetrics] = React.useState(systemMetrics)
    const [services, setServices] = React.useState<Array<{
      name: string
      status: 'operational' | 'processing' | 'warning' | 'error'
      label: string
    }>>(healthyServices)
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        // Simulate real-time metric updates
        setMetrics(prev => prev.map(metric => {
          if (metric.progress !== undefined) {
            const change = (Math.random() - 0.5) * 10
            const newProgress = Math.max(0, Math.min(100, metric.progress + change))
            return {
              ...metric,
              value: Math.round(newProgress),
              progress: newProgress
            }
          }
          return metric
        }))
        
        // Occasionally change service status
        if (Math.random() < 0.3) {
          setServices(prev => prev.map(service => {
            if (service.name === 'AI Service' && Math.random() < 0.5) {
              return {
                ...service,
                status: service.status === 'operational' ? 'processing' : 'operational',
                label: service.status === 'operational' ? 'Processing' : 'Online'
              }
            }
            return service
          }))
        }
      }, 2000)
      
      return () => clearInterval(interval)
    }, [])
    
    return (
      <SystemStatusPanel
        title="Live System Status"
        services={services}
        metrics={metrics}
      />
    )
  },
  parameters: {
    layout: 'centered',
  }
}

// Multiple panels showcase
export const MultiplePanels: Story = {
  render: () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
      <SystemStatusPanel
        title="Core Services"
        services={[
          { name: 'API Gateway', status: 'operational', label: 'Healthy' },
          { name: 'Authentication', status: 'operational', label: 'Active' },
          { name: 'Load Balancer', status: 'operational', label: 'Balanced' }
        ]}
        metrics={[]}
      />
      
      <SystemStatusPanel
        title="AI Processing"
        services={[
          { name: 'Document OCR', status: 'processing', label: 'Processing' },
          { name: 'Text Extraction', status: 'operational', label: 'Ready' },
          { name: 'Data Validation', status: 'operational', label: 'Active' }
        ]}
        metrics={[]}
      />
      
      <SystemStatusPanel
        title="Infrastructure"
        services={[]}
        metrics={[
          { name: 'Server Load', value: 34, unit: '%', progress: 34, max: 100 },
          { name: 'Network I/O', value: 12, unit: 'MB/s' },
          { name: 'Disk Space', value: 78, unit: '%', progress: 78, max: 100 }
        ]}
      />
      
      <SystemStatusPanel
        title="Business Metrics"
        services={[]}
        metrics={[
          { name: 'Daily Revenue', value: '$12.4k', unit: '' },
          { name: 'Active Sessions', value: '156', unit: '' },
          { name: 'Conversion Rate', value: '3.2', unit: '%' }
        ]}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}