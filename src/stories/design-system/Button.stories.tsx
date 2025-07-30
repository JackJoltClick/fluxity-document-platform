import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '../../components/design-system/foundations/Button'

const meta: Meta<typeof Button> = {
  title: 'Design System/Foundations/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Square-inspired button component with strategic accent colors and professional styling.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'success', 'premium', 'ghost'],
      description: 'Button variant following Square design philosophy'
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Button size'
    },
    loading: {
      control: 'boolean',
      description: 'Loading state with spinner'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button'
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Primary button - Strategic blue accent
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Upload Document',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
    )
  },
}

// Secondary button - Clean border style
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'View Details',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    )
  },
}

// Success button - Green accent
export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Process Complete',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    )
  },
}

// Premium button - Purple accent for special features
export const Premium: Story = {
  args: {
    variant: 'premium',
    children: 'Upgrade to Pro',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    )
  },
}

// Ghost button - Minimal style
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Cancel',
  },
}

// Loading state
export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Processing...',
    loading: true,
  },
}

// Disabled state
export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
}

// Size variations
export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-4">
        <Button size="sm" variant="primary">Small</Button>
        <Button size="md" variant="primary">Medium</Button>
        <Button size="lg" variant="primary">Large</Button>
      </div>
    </div>
  ),
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-x-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="success">Success</Button>
        <Button variant="premium">Premium</Button>
        <Button variant="ghost">Ghost</Button>
      </div>
    </div>
  ),
}

// Full width
export const FullWidth: Story = {
  args: {
    variant: 'primary',
    children: 'Full Width Button',
    fullWidth: true,
  },
  parameters: {
    layout: 'padded',
  },
}