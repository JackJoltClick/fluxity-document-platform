import type { Meta, StoryObj } from '@storybook/nextjs'
import { Input } from '../../components/design-system/forms/Input'

const meta: Meta<typeof Input> = {
  title: 'Design System/Forms/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Square-inspired input component with sophisticated styling, states, and validation feedback.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outlined', 'filled'],
      description: 'Input variant style'
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Input size'
    },
    state: {
      control: { type: 'select' },
      options: ['default', 'error', 'success', 'warning'],
      description: 'Input state'
    },
    label: {
      control: 'text',
      description: 'Label text'
    },
    helperText: {
      control: 'text',
      description: 'Helper text'
    },
    error: {
      control: 'text',
      description: 'Error message'
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default input
export const Default: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email address',
    type: 'email'
  }
}

// With helper text
export const WithHelperText: Story = {
  args: {
    label: 'Company Name',
    placeholder: 'Enter your company name',
    helperText: 'This will be displayed on your invoices and documents'
  }
}

// Required field
export const Required: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    type: 'password',
    required: true,
    helperText: 'Must be at least 8 characters long'
  }
}

// Error state
export const ErrorState: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email address',
    type: 'email',
    defaultValue: 'invalid-email',
    error: 'Please enter a valid email address'
  }
}

// Success state
export const SuccessState: Story = {
  args: {
    label: 'API Key',
    placeholder: 'Enter your API key',
    defaultValue: 'sk_live_••••••••••••••••',
    success: 'API key is valid and active'
  }
}

// Warning state
export const WarningState: Story = {
  args: {
    label: 'Password',
    type: 'password',
    defaultValue: 'password123',
    warning: 'This password is commonly used. Consider using a stronger password.'
  }
}

// With icons
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        label="Search Documents"
        placeholder="Search by filename or content"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
      
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        iconAfter={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        success="Email address verified"
      />
      
      <Input
        label="Amount"
        type="number"
        placeholder="0.00"
        icon={
          <span className="text-gray-500 font-medium">$</span>
        }
        helperText="Enter the invoice amount"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Default Variant</h3>
        <Input
          variant="default"
          label="Company Name"
          placeholder="Enter company name"
          helperText="This is the default input style"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Outlined Variant</h3>
        <Input
          variant="outlined"
          label="Project Name"
          placeholder="Enter project name"
          helperText="Outlined input with thicker border"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filled Variant</h3>
        <Input
          variant="filled"
          label="Description"
          placeholder="Enter description"
          helperText="Filled input with background color"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// All sizes
export const AllSizes: Story = {
  render: () => (
    <div className="space-y-6 w-80">
      <Input
        inputSize="sm"
        label="Small Input"
        placeholder="Small size input"
      />
      
      <Input
        inputSize="md"
        label="Medium Input"
        placeholder="Medium size input (default)"
      />
      
      <Input
        inputSize="lg"
        label="Large Input"
        placeholder="Large size input"
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Real-world form example
export const RealWorldForm: Story = {
  render: () => (
    <div className="max-w-md bg-white border border-gray-200 rounded-2xl p-8">
      <h2 className="text-2xl font-light text-gray-900 mb-6">Upload Document</h2>
      <div className="space-y-6">
        <Input
          label="Document Title"
          placeholder="Enter a descriptive title"
          required
          helperText="This will help you find the document later"
        />
        
        <Input
          label="Vendor Name"  
          placeholder="e.g., Amazon Web Services"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        
        <Input
          label="Invoice Amount"
          type="number"
          placeholder="0.00"
          icon={<span className="text-gray-500 font-medium">$</span>}
          helperText="Leave empty if not applicable"
        />
        
        <Input
          label="Tags" 
          placeholder="e.g., invoice, aws, cloud"
          helperText="Separate multiple tags with commas"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}