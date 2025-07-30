import type { Meta, StoryObj } from '@storybook/nextjs'
import { Heading, Text, Label, Caption } from '../../components/design-system/foundations/Typography'

const meta: Meta<typeof Heading> = {
  title: 'Design System/Foundations/Typography',
  component: Heading,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Square-inspired typography system with sophisticated light fonts and proper hierarchy.'
      }
    }
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// Heading examples
export const Headings: Story = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Display Variant (Light & Large)</h3>
        <div className="space-y-4">
          <Heading level={1} variant="display">Display Heading Level 1</Heading>
          <Heading level={2} variant="display">Display Heading Level 2</Heading>
          <Heading level={3} variant="display">Display Heading Level 3</Heading>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Heading Variant (Standard)</h3>
        <div className="space-y-4">
          <Heading level={1} variant="heading">Document Intelligence Platform</Heading>
          <Heading level={2} variant="heading">Processing Complete</Heading>
          <Heading level={3} variant="heading">Recent Activity</Heading>
          <Heading level={4} variant="heading">System Status</Heading>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Title Variant (Medium Weight)</h3>
        <div className="space-y-3">
          <Heading level={1} variant="title">Document Library</Heading>
          <Heading level={2} variant="title">Upload Documents</Heading>
          <Heading level={3} variant="title">Vendor Management</Heading>
          <Heading level={6} variant="title">Section Header</Heading>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Text examples
export const TextComponents: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Text Sizes</h3>
        <div className="space-y-3">
          <Text size="xl">Extra large text for important content</Text>
          <Text size="lg">Large text for emphasis</Text>
          <Text size="base">Base text for body content and descriptions</Text>
          <Text size="sm">Small text for captions and metadata</Text>
          <Text size="xs">Extra small text for fine print</Text>
        </div>
      </div>

      <div>  
        <h3 className="text-lg font-medium text-gray-900 mb-4">Text Colors</h3>
        <div className="space-y-3">
          <Text color="primary">Primary text color for headings and important content</Text>
          <Text color="secondary">Secondary text color for body content</Text>
          <Text color="muted">Muted text color for supporting information</Text>
          <Text color="disabled">Disabled text color for inactive elements</Text>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Font Weights</h3>
        <div className="space-y-3">
          <Text weight="light">Light weight text for sophisticated look</Text>
          <Text weight="normal">Normal weight text for body content</Text>
          <Text weight="medium">Medium weight text for emphasis</Text>
          <Text weight="semibold">Semibold weight text for strong emphasis</Text>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Label examples
export const Labels: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Form Labels</h3>
        <div className="space-y-4">
          <div>
            <Label>Email Address</Label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">example@company.com</div>
          </div>
          
          <div>
            <Label required>Password</Label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50">••••••••</div>
          </div>
          
          <div>
            <Label size="sm">Small Label</Label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm">Input content</div>
          </div>
          
          <div>
            <Label size="lg">Large Label</Label>
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-lg">Input content</div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Caption examples
export const Captions: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Caption Variants</h3>
        <div className="space-y-4">
          <div>
            <Label>Email Address</Label>
            <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">example@company.com</div>
            <Caption>We'll never share your email address with anyone else.</Caption>
          </div>
          
          <div>
            <Label>Password</Label>
            <div className="w-full px-4 py-2 border border-red-300 rounded-lg">••••••••</div>
            <Caption variant="error">Password must be at least 8 characters long.</Caption>
          </div>
          
          <div>
            <Label>Company Name</Label>
            <div className="w-full px-4 py-2 border border-green-300 rounded-lg">Acme Corporation</div>
            <Caption variant="success">Company name is available.</Caption>
          </div>
          
          <div>
            <Label>API Key</Label>
            <div className="w-full px-4 py-2 border border-amber-300 rounded-lg">sk_test_••••••••</div>
            <Caption variant="warning">Keep your API key secure and don't share it publicly.</Caption>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Real-world example
export const RealWorldExample: Story = {
  render: () => (
    <div className="max-w-2xl bg-white border border-gray-200 rounded-2xl p-8">
      <Heading level={1} variant="display" className="mb-3">
        Document Intelligence
      </Heading>
      <Text size="xl" color="muted" className="mb-8">
        Transform your document processing with AI-powered extraction and intelligent routing.
      </Text>
      
      <div className="space-y-6">
        <div>
          <Heading level={3} variant="heading" className="mb-4">
            Getting Started
          </Heading>
          <Text className="mb-4">
            Welcome to your document intelligence platform. Upload documents to begin extracting structured data using our AI-powered processing engine.
          </Text>
          <Caption>
            Supported formats: PDF, PNG, JPG, TIFF • Maximum file size: 10MB
          </Caption>
        </div>
        
        <div>
          <Heading level={4} variant="title" className="mb-3">
            Recent Activity
          </Heading>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2">
              <div>
                <Text weight="medium" color="primary">Invoice_Q1_2024.pdf</Text>
                <Caption>Processed 2 hours ago • $2,459.00</Caption>
              </div>
              <Text size="sm" color="muted">✓ Complete</Text>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Text weight="medium" color="primary">Receipt_Office_Supplies.pdf</Text>
                <Caption>Processing • 45% complete</Caption>
              </div>
              <Text size="sm" color="muted">🔄 Processing</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}