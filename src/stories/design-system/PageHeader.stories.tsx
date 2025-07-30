import type { Meta, StoryObj } from '@storybook/nextjs'
import { PageHeader } from '../../components/design-system/layout/PageHeader'

const meta: Meta<typeof PageHeader> = {
  title: 'Design System/Layout/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Sophisticated page header component with title, status, breadcrumbs, and actions following Square design philosophy.'
      }
    }
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Documents page header
export const DocumentsPage: Story = {
  args: {
    title: 'Documents',
    subtitle: 'Manage and process your document intelligence',
    status: {
      type: 'operational',
      label: 'Document processing active',
      animated: true
    },
    primaryAction: {
      label: 'Upload Document',
      href: '/documents/upload'
    }
  }
}

// Dashboard header
export const DashboardPage: Story = {
  args: {
    title: 'Dashboard',
    subtitle: 'Document intelligence overview and analytics',
    status: {
      type: 'operational',
      label: 'All systems operational'
    },
    primaryAction: {
      label: 'Upload Documents',
      href: '/documents/upload'
    }
  }
}

// With breadcrumb
export const WithBreadcrumb: Story = {
  args: {
    title: 'Invoice_Q1_2024.pdf',
    breadcrumb: {
      label: 'Back to Documents',
      href: '/documents'
    },
    primaryAction: {
      label: 'View File',
      href: '#'
    }
  }
}

// Processing state
export const ProcessingState: Story = {
  args: {
    title: 'Documents',
    subtitle: '1,247 documents in your library',
    status: {
      type: 'processing',
      label: '12 processing',
      animated: true
    },
    primaryAction: {
      label: 'Upload Document',
      href: '/documents/upload'
    }
  }
}

// Error state
export const ErrorState: Story = {
  args: {
    title: 'Documents',
    subtitle: 'Manage and process your document intelligence',
    status: {
      type: 'error',
      label: 'Connection error'
    },
    primaryAction: {
      label: 'Upload Document',
      href: '/documents/upload'
    }
  }
}

// Multiple actions
export const MultipleActions: Story = {
  args: {
    title: 'Reports',
    subtitle: 'Business analytics and document insights',
    status: {
      type: 'operational',
      label: 'Data updated 5 minutes ago'
    },
    actions: (
      <div className="flex items-center space-x-3">
        <button className="stripe-button stripe-button-secondary px-4 py-2 text-sm">
          Export
        </button>
        <button className="stripe-button stripe-button-secondary px-4 py-2 text-sm">
          Filter
        </button>
      </div>
    ),
    primaryAction: {
      label: 'Generate Report',
      href: '/reports/new'
    }
  }
}