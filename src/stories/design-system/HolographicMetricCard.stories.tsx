import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { HolographicMetricCard } from '../../components/design-system/dashboard/HolographicMetricCard'

const sampleData = {
  totalDocuments: { 
    current: 1247, 
    velocity: 8,
    change: 12.5,
    description: "Total documents uploaded"
  },
  extracted: { 
    current: 1189, 
    velocity: 6,
    change: 15.2,
    accuracy: 94.7,
    description: "Successfully processed"
  },
  pendingReview: { 
    current: 23, 
    velocity: 2,
    change: -3.1,
    avgTime: 45,
    description: "Awaiting manual review"
  },
  totalValue: { 
    current: 847650, 
    velocity: 2500,
    change: 18.7,
    avgInvoice: 680,
    description: "Total invoice value processed"
  }
}

const DocumentIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ExtractIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
  </svg>
)

const ReviewIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const ValueIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
  </svg>
)

const meta: Meta<typeof HolographicMetricCard> = {
  title: 'Design System/Dashboard/HolographicMetricCard',
  component: HolographicMetricCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Sophisticated 3D holographic metric card with mouse tracking and real-time data visualization.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Card title'
    },
    cardId: {
      control: 'text',
      description: 'Unique identifier for mouse tracking'
    },
    gradient: {
      control: 'text',
      description: 'Background gradient classes'
    },
    enableMouseTracking: {
      control: 'boolean',
      description: 'Enable 3D mouse tracking effects'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Total Documents card
export const TotalDocuments: Story = {
  args: {
    title: 'Total Documents',
    data: sampleData.totalDocuments,
    cardId: 'totalDocuments',
    icon: <DocumentIcon />,
    enableMouseTracking: true,
    onCardClick: () => console.log('Navigating to documents...')
  }
}

// Extracted Data card
export const ExtractedData: Story = {
  args: {
    title: 'Extracted Data',
    data: sampleData.extracted,
    cardId: 'extracted',
    icon: <ExtractIcon />,
    enableMouseTracking: true,
    onCardClick: () => console.log('Navigating to processed documents...')
  }
}

// Pending Review card
export const PendingReview: Story = {
  args: {
    title: 'Pending Review',
    data: sampleData.pendingReview,
    cardId: 'pendingReview',
    icon: <ReviewIcon />,
    enableMouseTracking: true,
    onCardClick: () => console.log('Navigating to pending documents...')
  }
}

// Invoice Value card
export const InvoiceValue: Story = {
  args: {
    title: 'Invoice Value',
    data: sampleData.totalValue,
    cardId: 'totalValue',
    icon: <ValueIcon />,
    enableMouseTracking: true,
    onCardClick: () => console.log('Navigating to reports...')
  }
}

// Without mouse tracking
export const StaticCard: Story = {
  args: {
    title: 'Total Documents',
    data: sampleData.totalDocuments,
    cardId: 'static',
    icon: <DocumentIcon />,
    enableMouseTracking: false
  }
}

// Custom gradient
export const CustomGradient: Story = {
  args: {
    title: 'Custom Metric',
    data: {
      current: 567,
      velocity: 12,
      change: 8.3,
      description: 'Custom metric description'
    },
    cardId: 'custom',
    icon: <DocumentIcon />,
    gradient: 'bg-gradient-to-br from-blue-800 to-purple-900',
    enableMouseTracking: true
  }
}

// Dashboard grid showcase
export const DashboardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl bg-gray-100 p-8 rounded-2xl">
      <HolographicMetricCard
        title="Total Documents"
        data={sampleData.totalDocuments}
        cardId="grid-totalDocuments"
        icon={<DocumentIcon />}
        onCardClick={() => console.log('Documents clicked')}
      />
      
      <HolographicMetricCard
        title="Extracted Data"
        data={sampleData.extracted}
        cardId="grid-extracted"
        icon={<ExtractIcon />}
        onCardClick={() => console.log('Extracted clicked')}
      />
      
      <HolographicMetricCard
        title="Pending Review"
        data={sampleData.pendingReview}
        cardId="grid-pendingReview"
        icon={<ReviewIcon />}
        onCardClick={() => console.log('Pending clicked')}
      />
      
      <HolographicMetricCard
        title="Invoice Value"
        data={sampleData.totalValue}
        cardId="grid-totalValue"
        icon={<ValueIcon />}
        onCardClick={() => console.log('Value clicked')}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  }
}

// Real-world example with live updates
export const LiveUpdates: Story = {
  render: () => {
    const [metrics, setMetrics] = React.useState(sampleData.totalDocuments)
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          current: prev.current + Math.floor(Math.random() * 5),
          velocity: Math.floor(Math.random() * 15) + 5,
          change: (Math.random() * 20) + 5
        }))
      }, 2000)
      
      return () => clearInterval(interval)
    }, [])
    
    return (
      <div className="bg-gray-100 p-8 rounded-2xl">
        <h3 className="text-2xl font-light text-gray-900 mb-6">Live Updating Metric</h3>
        <HolographicMetricCard
          title="Live Documents"
          data={metrics}
          cardId="live-updates"
          icon={<DocumentIcon />}
          onCardClick={() => console.log('Live metric clicked')}
        />
      </div>
    )
  },
  parameters: {
    layout: 'centered',
  }
}