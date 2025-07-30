import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { DashboardHeader } from '../../components/design-system/dashboard/DashboardHeader'

const meta: Meta<typeof DashboardHeader> = {
  title: 'Design System/Dashboard/DashboardHeader',
  component: DashboardHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Sophisticated dashboard header with greeting, insights, system status, and primary action button following Square design philosophy.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    userName: {
      control: 'text',
      description: 'User display name or email'
    },
    greeting: {
      control: 'text',
      description: 'Custom greeting (auto-generated if not provided)'
    },
    insight: {
      control: 'text',
      description: 'Business insight or status message'
    },
    systemStatus: {
      control: { type: 'select' },
      options: ['operational', 'processing', 'warning', 'error'],
      description: 'System status indicator'
    },
    lastUpdated: {
      control: 'text',
      description: 'Last updated timestamp'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default header
export const Default: Story = {
  args: {
    userName: 'john.doe@company.com',
    insight: '📈 Processing efficiency increased 23% this month'
  }
}

// Custom greeting
export const CustomGreeting: Story = {
  args: {
    userName: 'Sarah',
    greeting: 'Welcome back',
    insight: '⚡ AI accuracy improved to 94.2% this week',
    systemStatus: 'operational'
  }
}

// Processing state
export const ProcessingState: Story = {
  args: {
    userName: 'mike.wilson@startup.io',
    insight: '🔄 Processing 45 documents in the queue',
    systemStatus: 'processing',
    lastUpdated: '2 minutes ago'
  }
}

// Warning state
export const WarningState: Story = {
  args: {
    userName: 'admin@company.com',
    greeting: 'Good afternoon',
    insight: '⚠️ Some AI services are running slower than usual',
    systemStatus: 'warning',
    lastUpdated: '5 minutes ago'
  }
}

// Error state
export const ErrorState: Story = {
  args: {
    userName: 'support',
    insight: '🚨 Document processing temporarily unavailable',
    systemStatus: 'error',
    lastUpdated: '10 minutes ago'
  }
}

// Custom action button
export const CustomAction: Story = {
  args: {
    userName: 'analyst@company.com',
    insight: '📊 Ready to analyze your document data',
    actionButton: {
      label: 'View Reports',
      href: '/reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  }
}

// No action button
export const NoActionButton: Story = {
  args: {
    userName: 'viewer@company.com',
    insight: '👀 Viewing dashboard in read-only mode',
    actionButton: undefined
  }
}

// Different insights showcase
export const InsightVariations: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <DashboardHeader
        userName="john@company.com"
        insight="📈 Processing efficiency increased 23% this month"
        systemStatus="operational"
      />
      
      <DashboardHeader
        userName="sarah@startup.io"
        insight="⚡ AI accuracy improved to 94.2% this week"
        systemStatus="operational"
      />
      
      <DashboardHeader
        userName="mike@enterprise.com"
        insight="🎯 On track to exceed monthly targets by 15%"
        systemStatus="processing"
      />
      
      <DashboardHeader
        userName="admin@company.com"
        insight="💡 Smart automation saving 2.3 hours daily"
        systemStatus="operational"
      />
      
      <DashboardHeader
        userName="support@company.com"
        insight="🚀 New features deployed successfully"
        systemStatus="operational"
      />
      
      <DashboardHeader
        userName="ops@company.com"
        insight="✨ System performance optimized"
        systemStatus="operational"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Real-world usage example
export const RealWorldExample: Story = {
  render: () => {
    const [currentTime, setCurrentTime] = React.useState(new Date())
    
    React.useEffect(() => {
      const timer = setInterval(() => {
        setCurrentTime(new Date())
      }, 1000)
      
      return () => clearInterval(timer)
    }, [])
    
    const getTimeBasedInsight = () => {
      const hour = currentTime.getHours()
      if (hour < 9) return "🌅 Early bird! Your productivity is ahead of schedule"
      if (hour < 12) return "📈 Morning momentum: Processing efficiency up 23%"
      if (hour < 17) return "⚡ Afternoon analytics: AI accuracy at 94.2%"
      return "🌙 Evening overview: All systems running smoothly"
    }
    
    return (
      <DashboardHeader
        userName="product.manager@fluxity.ai"
        insight={getTimeBasedInsight()}
        systemStatus="operational"
        lastUpdated={currentTime.toLocaleTimeString()}
      />
    )
  },
  parameters: {
    layout: 'padded',
  }
}