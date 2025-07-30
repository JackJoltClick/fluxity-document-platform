import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { ProcessingProgress } from '../../components/design-system/feedback/ProcessingProgress'

const meta: Meta<typeof ProcessingProgress> = {
  title: 'Design System/Feedback/ProcessingProgress',
  component: ProcessingProgress,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Processing progress component for displaying document processing status with animated progress bars and state-specific styling.'
      }
    }
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Pending state
export const Pending: Story = {
  args: {
    status: 'pending',
    progress: 5
  }
}

// Processing state
export const Processing: Story = {
  args: {
    status: 'processing',
    progress: 65
  }
}

// Completed state
export const Completed: Story = {
  args: {
    status: 'completed',
    progress: 100
  }
}

// Failed state
export const Failed: Story = {
  args: {
    status: 'failed',
    progress: 45,
    onRetry: () => console.log('Retrying processing...')
  }
}

// Failed with retry in progress
export const FailedRetrying: Story = {
  args: {
    status: 'failed',
    progress: 30,
    onRetry: () => console.log('Retrying processing...'),
    retrying: true
  }
}

// Custom content
export const CustomContent: Story = {
  args: {
    status: 'processing',
    progress: 75,
    title: 'Advanced AI Analysis',
    description: 'Processing complex document structure',
    infoText: 'Our advanced AI model is analyzing the document layout, extracting text, and identifying key data points including line items, totals, and vendor information.'
  }
}

// Progress states showcase
export const ProgressStates: Story = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <ProcessingProgress
        status="pending"
        progress={5}
      />
      
      <ProcessingProgress
        status="processing"
        progress={25}
      />
      
      <ProcessingProgress
        status="processing"
        progress={75}
      />
      
      <ProcessingProgress
        status="completed"
        progress={100}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Real-time progress simulation
export const RealTimeProgress: Story = {
  render: () => {
    const [progress, setProgress] = React.useState(15)
    const [status, setStatus] = React.useState<'pending' | 'processing' | 'completed' | 'failed'>('processing')
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10
          if (newProgress >= 100) {
            setStatus('completed')
            return 100
          }
          return newProgress
        })
      }, 1000)
      
      return () => clearInterval(interval)
    }, [])
    
    return (
      <ProcessingProgress
        status={status}
        progress={progress}
        infoText={
          status === 'completed' 
            ? 'Document processing completed successfully! All data has been extracted and is ready for review.'
            : 'Our AI is analyzing your document to extract key information including suppliers, amounts, dates, and line items.'
        }
      />
    )
  },
  parameters: {
    layout: 'centered',
  }
}