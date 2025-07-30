import type { Meta, StoryObj } from '@storybook/nextjs'
import { EmptyState } from '../../components/design-system/feedback/EmptyState'

const meta: Meta<typeof EmptyState> = {
  title: 'Design System/Feedback/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Empty state component for displaying when no content is available, with optional actions and custom icons.'
      }
    }
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// No documents
export const NoDocuments: Story = {
  args: {
    title: 'No documents yet',
    description: 'Start by uploading your first document to begin intelligent document processing',
    primaryAction: {
      label: 'Upload Your First Document',
      href: '/documents/upload'
    }
  }
}

// Search results
export const NoSearchResults: Story = {
  args: {
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you\'re looking for',
    icon: (
      <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    primaryAction: {
      label: 'Clear Filters',
      href: '#'
    },
    secondaryAction: {
      label: 'View All Documents',
      href: '/documents'
    }
  }
}

// Compact variant
export const Compact: Story = {
  args: {
    title: 'No vendors configured',
    description: 'Add vendors to enable automatic document routing',
    variant: 'compact',
    primaryAction: {
      label: 'Add Vendor',
      href: '/vendors/new'
    }
  }
}

// Custom content
export const CustomContent: Story = {
  args: {
    title: 'Welcome to Fluxity',
    description: 'Your intelligent document processing platform',
    children: (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <strong>Pro Tip:</strong> Upload invoices, receipts, and contracts to get started with AI-powered data extraction.
        </div>
        <div className="flex items-center justify-center space-x-4">
          <button className="stripe-button stripe-button-primary px-6 py-3">
            Upload Document
          </button>
          <button className="stripe-button stripe-button-secondary px-6 py-3">
            Take Tour
          </button>
        </div>
      </div>
    )
  }
}

// Different icons
export const WithCustomIcons: Story = {
  render: () => (
    <div className="space-y-8 max-w-2xl">
      <EmptyState
        title="No invoices processed"
        description="Upload invoices to begin AI-powered data extraction"
        icon={
          <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        primaryAction={{
          label: 'Upload Invoice',
          href: '/upload'
        }}
      />
      
      <EmptyState
        title="Processing queue empty"
        description="All documents have been processed successfully"
        icon={
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        variant="compact"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}