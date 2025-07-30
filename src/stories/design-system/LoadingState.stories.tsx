import type { Meta, StoryObj } from '@storybook/nextjs'
import { LoadingState } from '../../components/design-system/feedback/LoadingState'

const meta: Meta<typeof LoadingState> = {
  title: 'Design System/Feedback/LoadingState',
  component: LoadingState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Square-inspired loading state component with multiple variants for different loading scenarios.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['spinner', 'skeleton', 'dots', 'pulse'],
      description: 'Loading variant type'
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg', 'xl'],
      description: 'Size of the loading indicator'
    },
    message: {
      control: 'text',
      description: 'Loading message to display'
    },
    centered: {
      control: 'boolean',
      description: 'Whether to center the loading state'
    },
    inline: {
      control: 'boolean',
      description: 'Whether to display inline (for smaller loading states)'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default spinner
export const Spinner: Story = {
  args: {
    variant: 'spinner',
    size: 'md',
    message: 'Processing document...'
  }
}

// Dots animation
export const Dots: Story = {
  args: {
    variant: 'dots',
    size: 'md',
    message: 'AI extraction in progress'
  }
}

// Pulse animation
export const Pulse: Story = {
  args: {
    variant: 'pulse',
    size: 'md',
    message: 'Loading...'
  }
}

// Skeleton loading
export const Skeleton: Story = {
  args: {
    variant: 'skeleton',
    size: 'md',
    message: 'Loading content'
  }
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-8 max-w-4xl">
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Spinner Variants</h3>
        <div className="space-y-4">
          <LoadingState variant="spinner" size="sm" message="Small spinner" />
          <LoadingState variant="spinner" size="md" message="Medium spinner" />
          <LoadingState variant="spinner" size="lg" message="Large spinner" />
          <LoadingState variant="spinner" size="xl" message="Extra large spinner" />
        </div>
      </div>
      
      <div className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">Other Variants</h3>
        <div className="space-y-4">
          <LoadingState variant="dots" message="Dots animation" />
          <LoadingState variant="pulse" message="Pulse animation" />
          <LoadingState variant="skeleton" message="Skeleton loading" />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Inline loading states
export const InlineStates: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Inline Loading States</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <span className="text-gray-900">Document processing</span>
          <LoadingState variant="spinner" size="sm" inline />
        </div>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <span className="text-gray-900">AI extraction</span>
          <LoadingState variant="dots" size="sm" message="45% complete" inline />
        </div>
        
        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
          <span className="text-gray-900">Saving changes</span>
          <LoadingState variant="pulse" size="sm" inline />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Centered loading states
export const CenteredStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-2xl">
        <LoadingState 
          variant="spinner" 
          size="lg" 
          message="Loading document library..." 
          centered 
        />
      </div>
      
      <div className="bg-white border border-gray-200 rounded-2xl">
        <LoadingState 
          variant="skeleton" 
          message="Preparing document preview..." 
          centered 
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Real-world examples
export const RealWorldExamples: Story = {
  render: () => (
    <div className="space-y-8 max-w-3xl">
      {/* Document upload */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-light text-gray-900 mb-4">Document Upload</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8">
          <LoadingState 
            variant="dots" 
            size="lg" 
            message="Uploading Invoice_Q1_2024.pdf (2.4 MB)" 
            centered 
          />
        </div>
      </div>

      {/* Processing queue */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-light text-gray-900 mb-4">Processing Queue</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Receipt_Office_Supplies.pdf</p>
              <p className="text-sm text-gray-500">AI extraction • Step 2 of 3</p>
            </div>
            <LoadingState variant="spinner" size="sm" inline />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900">Invoice_Software_License.pdf</p>
              <p className="text-sm text-gray-500">Data validation • Step 3 of 3</p>
            </div>
            <LoadingState variant="pulse" size="sm" message="95%" inline />
          </div>
        </div>
      </div>

      {/* Dashboard loading */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h3 className="text-xl font-light text-gray-900 mb-4">Dashboard Metrics</h3>
        <LoadingState 
          variant="skeleton" 
          message="Loading analytics data..." 
          centered 
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}