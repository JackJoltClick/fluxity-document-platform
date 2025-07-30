import type { Meta, StoryObj } from '@storybook/nextjs'
import { QuickActionCard } from '../../components/design-system/dashboard/QuickActionCard'

const UploadIcon = () => (
  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
)

const VendorIcon = () => (
  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const ReportIcon = () => (
  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const meta: Meta<typeof QuickActionCard> = {
  title: 'Design System/Dashboard/QuickActionCard',
  component: QuickActionCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Quick action card component for dashboard shortcuts with icons, descriptions, and hover effects following Square design philosophy.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Action title'
    },
    description: {
      control: 'text',
      description: 'Action description'
    },
    href: {
      control: 'text',
      description: 'Link destination'
    },
    external: {
      control: 'boolean',
      description: 'Whether to use external link'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Upload document action
export const UploadDocument: Story = {
  args: {
    title: 'Upload Document',
    description: 'Process new invoices',
    icon: <UploadIcon />,
    href: '/documents/upload',
    onActionClick: () => console.log('Upload clicked')
  }
}

// Manage vendors action
export const ManageVendors: Story = {
  args: {
    title: 'Manage Vendors',
    description: 'Update supplier info',
    icon: <VendorIcon />,
    href: '/vendors',
    onActionClick: () => console.log('Vendors clicked')
  }
}

// View reports action
export const ViewReports: Story = {
  args: {
    title: 'View Reports',
    description: 'Business analytics',
    icon: <ReportIcon />,
    href: '/reports',
    onActionClick: () => console.log('Reports clicked')
  }
}

// Settings action
export const Settings: Story = {
  args: {
    title: 'Account Settings',
    description: 'Manage your preferences',
    icon: <SettingsIcon />,
    href: '/settings',
    onActionClick: () => console.log('Settings clicked')
  }
}

// With emoji icon
export const EmojiIcon: Story = {
  args: {
    title: 'AI Processing',
    description: 'Configure AI models',
    icon: '🤖',
    href: '/ai-settings',
    onActionClick: () => console.log('AI clicked')
  }
}

// External link
export const ExternalLink: Story = {
  args: {
    title: 'Documentation',
    description: 'View API reference',
    icon: '📚',
    href: 'https://docs.example.com',
    external: true,
    onActionClick: () => console.log('External docs clicked')
  }
}

// Quick actions panel
export const QuickActionsPanel: Story = {
  render: () => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 max-w-md">
      <h3 className="text-2xl font-light text-gray-900 mb-6 tracking-tight">Quick Actions</h3>
      <div className="space-y-4">
        <QuickActionCard
          title="Upload Document"
          description="Process new invoices"
          icon="📄"
          href="/documents/upload"
          onActionClick={() => console.log('Upload clicked')}
        />
        <QuickActionCard
          title="Manage Vendors"
          description="Update supplier info"
          icon="🏢"
          href="/vendors"
          onActionClick={() => console.log('Vendors clicked')}
        />
        <QuickActionCard
          title="View Reports"
          description="Business analytics"
          icon="📊"
          href="/reports"
          onActionClick={() => console.log('Reports clicked')}
        />
        <QuickActionCard
          title="AI Settings"
          description="Configure processing"
          icon="⚙️"
          href="/settings/ai"
          onActionClick={() => console.log('AI settings clicked')}
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'centered',
  }
}

// Icon variations showcase
export const IconVariations: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SVG Icons</h3>
        <div className="space-y-4">
          <QuickActionCard
            title="Upload Files"
            description="Add new documents"
            icon={<UploadIcon />}
            href="/upload"
          />
          <QuickActionCard
            title="Manage Vendors"
            description="Supplier management"
            icon={<VendorIcon />}
            href="/vendors"
          />
          <QuickActionCard
            title="Analytics"
            description="View insights"
            icon={<ReportIcon />}
            href="/analytics"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Emoji Icons</h3>
        <div className="space-y-4">
          <QuickActionCard
            title="Documents"
            description="Manage files"
            icon="📄"
            href="/documents"
          />
          <QuickActionCard
            title="Teams"
            description="User management"
            icon="👥"
            href="/teams"
          />
          <QuickActionCard
            title="Security"
            description="Access controls"
            icon="🔒"
            href="/security"
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Different states showcase
export const StateShowcase: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <QuickActionCard
        title="Primary Action"
        description="Most important action"
        icon={<UploadIcon />}
        href="/primary"
        className="border-blue-200 hover:border-blue-300 hover:bg-blue-50"
      />
      
      <QuickActionCard
        title="Warning Action"
        description="Requires attention"
        icon="⚠️"
        href="/warning"
        className="border-amber-200 hover:border-amber-300 hover:bg-amber-50"
      />
      
      <QuickActionCard
        title="Success Action"
        description="Completed successfully"
        icon="✅"
        href="/success"
        className="border-green-200 hover:border-green-300 hover:bg-green-50"
      />
      
      <QuickActionCard
        title="Disabled Action"
        description="Currently unavailable"
        icon="🚫"
        href="#"
        className="opacity-50 cursor-not-allowed hover:bg-transparent hover:border-gray-100"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}