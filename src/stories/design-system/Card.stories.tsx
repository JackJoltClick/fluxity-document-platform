import type { Meta, StoryObj } from '@storybook/nextjs'
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../../components/design-system/layout/Card'
import { Button } from '../../components/design-system/foundations/Button'

const meta: Meta<typeof Card> = {
  title: 'Design System/Layout/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Square-inspired card component with sophisticated styling and layout options.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'elevated', 'outlined', 'ghost'],
      description: 'Card variant following Square design philosophy'
    },
    padding: {
      control: { type: 'select' },  
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'Card padding size'
    },
    hoverable: {
      control: 'boolean',
      description: 'Whether card should have hover effects'
    },
    clickable: {
      control: 'boolean',
      description: 'Whether card content should be clickable'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default card
export const Default: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    children: (
      <div>
        <h3 className="text-xl font-light text-gray-900 mb-2">Document Information</h3>
        <p className="text-gray-500 font-light">This is a basic card with default styling following our Square-inspired design system.</p>
      </div>
    )
  }
}

// Elevated card with more shadow
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    padding: 'lg',
    children: (
      <div>
        <h3 className="text-xl font-light text-gray-900 mb-2">Elevated Card</h3>
        <p className="text-gray-500 font-light">This card has enhanced shadow for more prominence.</p>
      </div>
    )
  }
}

// Card with structured header and content
export const WithHeaderAndContent: Story = {
  args: {
    variant: 'default',
    padding: 'none',
    children: (
      <>
        <CardHeader>
          <CardTitle level={2}>Document Library</CardTitle>
          <CardDescription>Manage your document intelligence platform</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">This card demonstrates the structured header and content layout that we use throughout the application.</p>
          <div className="flex space-x-4">
            <Button variant="primary" size="sm">Upload Document</Button>
            <Button variant="secondary" size="sm">View All</Button>
          </div>
        </CardContent>
      </>
    )
  }
}

// Hoverable card
export const Hoverable: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    hoverable: true,
    children: (
      <div>
        <h3 className="text-xl font-light text-gray-900 mb-2">Hoverable Card</h3>
        <p className="text-gray-500 font-light">Hover over this card to see the elevation effect.</p>
      </div>
    )
  }
}

// Clickable card
export const Clickable: Story = {
  args: {
    variant: 'default',
    padding: 'md',
    clickable: true,
    onClick: () => alert('Card clicked!'),
    children: (
      <div>
        <h3 className="text-xl font-light text-gray-900 mb-2">Clickable Card</h3>
        <p className="text-gray-500 font-light">This entire card is clickable. Try clicking anywhere on it.</p>
      </div>
    )
  }
}

// All variants showcase
export const AllVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-6 max-w-4xl">
      <Card variant="default" padding="md">
        <CardTitle level={3}>Default</CardTitle>
        <CardDescription>Standard card with shadow</CardDescription>
      </Card>
      <Card variant="elevated" padding="md">
        <CardTitle level={3}>Elevated</CardTitle>
        <CardDescription>Enhanced shadow for prominence</CardDescription>
      </Card>
      <Card variant="outlined" padding="md">
        <CardTitle level={3}>Outlined</CardTitle>
        <CardDescription>Emphasized border styling</CardDescription>
      </Card>
      <Card variant="ghost" padding="md">
        <CardTitle level={3}>Ghost</CardTitle>
        <CardDescription>Subtle background variant</CardDescription>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Document card example (real-world usage)
export const DocumentCard: Story = {
  args: {
    variant: 'default',
    padding: 'none',
    hoverable: true,
    children: (
      <>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle level={2}>Invoice_Q1_2024.pdf</CardTitle>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-500">Processed</span>
            </div>
          </div>
          <CardDescription>Uploaded 2 hours ago • Amazon Web Services • $2,459.00</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI extraction completed</p>
                <p className="text-xs text-gray-500">Method: OpenAI • Cost: $0.0045</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="secondary" size="sm">View Details</Button>
              <Button variant="primary" size="sm">Download</Button>
            </div>
          </div>
        </CardContent>
      </>
    )
  }
}