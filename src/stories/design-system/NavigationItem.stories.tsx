import type { Meta, StoryObj } from '@storybook/nextjs'
import { NavigationItem } from '../../components/design-system/navigation/NavigationItem'

const meta: Meta<typeof NavigationItem> = {
  title: 'Design System/Navigation/NavigationItem',
  component: NavigationItem,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const DashboardIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
  </svg>
)

const DocumentsIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

export const Default: Story = {
  args: {
    name: 'Dashboard',
    href: '/dashboard',
    icon: DashboardIcon,
  },
}

export const Active: Story = {
  args: {
    name: 'Documents',
    href: '/documents',
    icon: DocumentsIcon,
    isActive: true,
  },
}

export const WithoutIcon: Story = {
  args: {
    name: 'Settings',
    href: '/settings',
  },
}

export const SidebarVariant: Story = {
  args: {
    name: 'Dashboard',
    href: '/dashboard',
    icon: DashboardIcon,
    variant: 'sidebar',
  },
}

export const SidebarActive: Story = {
  args: {
    name: 'Documents',
    href: '/documents',
    icon: DocumentsIcon,
    variant: 'sidebar',
    isActive: true,
    showActiveIndicator: true,
  },
}

export const TabsVariant: Story = {
  args: {
    name: 'Overview',
    href: '/overview',
    variant: 'tabs',
  },
}

export const TabsActive: Story = {
  args: {
    name: 'Details',
    href: '/details',
    variant: 'tabs',
    isActive: true,
  },
}

export const WithBadge: Story = {
  args: {
    name: 'Messages',
    href: '/messages',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8-1.274 0-2.47-.255-3.58-.729L1 21l1.729-6.42C2.255 13.47 2 12.274 2 11c0-4.418 4.03-8 9-8s9 3.582 9 9z" />
      </svg>
    ),
    badge: (
      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
        3
      </span>
    ),
  },
}

export const Disabled: Story = {
  args: {
    name: 'Coming Soon',
    href: '/coming-soon',
    icon: DashboardIcon,
    disabled: true,
  },
}

export const AsButton: Story = {
  args: {
    name: 'Log Out',
    href: '#',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
    onClick: () => alert('Logging out...'),
  },
}