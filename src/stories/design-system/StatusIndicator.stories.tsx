import type { Meta, StoryObj } from '@storybook/nextjs'
import { StatusIndicator } from '../../components/design-system/feedback/StatusIndicator'

const meta: Meta<typeof StatusIndicator> = {
  title: 'Design System/Feedback/StatusIndicator',
  component: StatusIndicator,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Square-inspired status indicator component with strategic color usage and multiple display variants.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'select' },
      options: ['operational', 'processing', 'success', 'warning', 'error', 'offline'],
      description: 'Status type following Square design philosophy'
    },
    variant: {
      control: { type: 'select' },
      options: ['dot', 'badge', 'pill'],
      description: 'Display variant'
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Size of the indicator'
    },
    animated: {
      control: 'boolean',
      description: 'Whether to show animation for active states'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Operational status
export const Operational: Story = {
  args: {
    status: 'operational',
    variant: 'dot',
    animated: true,
    label: 'All systems operational'
  }
}

// Processing status with animation
export const Processing: Story = {
  args: {
    status: 'processing',
    variant: 'dot',
    animated: true,
    label: 'AI processing document'
  }
}

// Success status
export const Success: Story = {
  args: {
    status: 'success',
    variant: 'badge',
    label: 'Processing complete'
  }
}

// Warning status
export const Warning: Story = {
  args: {
    status: 'warning',
    variant: 'badge',
    label: 'Review required'
  }
}

// Error status
export const Error: Story = {
  args: {
    status: 'error',
    variant: 'badge',
    label: 'Processing failed'
  }
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dot Variant</h3>
        <div className="space-y-3">
          <StatusIndicator status="operational" variant="dot" animated />
          <StatusIndicator status="processing" variant="dot" animated />
          <StatusIndicator status="success" variant="dot" />
          <StatusIndicator status="warning" variant="dot" />
          <StatusIndicator status="error" variant="dot" />
          <StatusIndicator status="offline" variant="dot" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Badge Variant</h3>
        <div className="space-y-3">
          <StatusIndicator status="operational" variant="badge" animated />
          <StatusIndicator status="processing" variant="badge" animated />
          <StatusIndicator status="success" variant="badge" />
          <StatusIndicator status="warning" variant="badge" />
          <StatusIndicator status="error" variant="badge" />
          <StatusIndicator status="offline" variant="badge" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Pill Variant</h3>
        <div className="space-y-3">
          <StatusIndicator status="operational" variant="pill" animated />
          <StatusIndicator status="processing" variant="pill" animated />
          <StatusIndicator status="success" variant="pill" />
          <StatusIndicator status="warning" variant="pill" />
          <StatusIndicator status="error" variant="pill" />
          <StatusIndicator status="offline" variant="pill" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Size variations
export const Sizes: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dot Sizes</h3>
        <div className="flex items-center space-x-6">
          <StatusIndicator status="operational" variant="dot" size="sm" label="Small" />
          <StatusIndicator status="operational" variant="dot" size="md" label="Medium" />
          <StatusIndicator status="operational" variant="dot" size="lg" label="Large" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Badge Sizes</h3>
        <div className="flex items-center space-x-4">
          <StatusIndicator status="processing" variant="badge" size="sm" />
          <StatusIndicator status="processing" variant="badge" size="md" />
          <StatusIndicator status="processing" variant="badge" size="lg" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Real-world usage examples
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      {/* System status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-light text-gray-900 mb-4">System Status</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Processing Engine</span>
            <StatusIndicator status="operational" variant="dot" animated />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">AI Service</span>
            <StatusIndicator status="processing" variant="dot" animated label="Online" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Database</span>
            <StatusIndicator status="success" variant="dot" label="Connected" />
          </div>
        </div>
      </div>

      {/* Document status */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-light text-gray-900 mb-4">Document Processing</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Invoice_Q1_2024.pdf</p>
              <p className="text-sm text-gray-500">Uploaded 2 hours ago</p>
            </div>
            <StatusIndicator status="success" variant="badge" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Receipt_Office_Supplies.pdf</p>
              <p className="text-sm text-gray-500">Uploaded 4 hours ago</p>
            </div>
            <StatusIndicator status="processing" variant="badge" animated />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Invoice_Software_License.pdf</p>
              <p className="text-sm text-gray-500">Uploaded 1 day ago</p>
            </div>
            <StatusIndicator status="error" variant="badge" />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}