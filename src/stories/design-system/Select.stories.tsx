import type { Meta, StoryObj } from '@storybook/nextjs'
import { Select } from '../../components/design-system/forms/Select'

const sampleOptions = [
  { value: 'invoice', label: 'Invoice' },
  { value: 'receipt', label: 'Receipt' },
  { value: 'contract', label: 'Contract' },
  { value: 'purchase_order', label: 'Purchase Order' },
  { value: 'other', label: 'Other' }
]

const vendorOptions = [
  { value: 'aws', label: 'Amazon Web Services' },
  { value: 'azure', label: 'Microsoft Azure' },
  { value: 'gcp', label: 'Google Cloud Platform' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'square', label: 'Square' },
  { value: 'other', label: 'Other Vendor' }
]

const meta: Meta<typeof Select> = {
  title: 'Design System/Forms/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Square-inspired select component with sophisticated styling, states, and validation feedback.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'outlined', 'filled'],
      description: 'Select variant style'
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'Select size'
    },
    state: {
      control: { type: 'select' },
      options: ['default', 'error', 'success', 'warning'],
      description: 'Select state'
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
      description: 'Full width select'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Default select
export const Default: Story = {
  args: {
    label: 'Document Type',
    placeholder: 'Select document type',
    options: sampleOptions
  }
}

// With helper text
export const WithHelperText: Story = {
  args: {
    label: 'Vendor',
    placeholder: 'Choose a vendor',
    options: vendorOptions,
    helperText: 'Select the vendor associated with this document'
  }
}

// Required field
export const Required: Story = {
  args: {
    label: 'Processing Priority',
    placeholder: 'Select priority level',
    required: true,
    options: [
      { value: 'low', label: 'Low Priority' },
      { value: 'medium', label: 'Medium Priority' },
      { value: 'high', label: 'High Priority' },
      { value: 'urgent', label: 'Urgent' }
    ],
    helperText: 'This determines processing order'
  }
}

// Error state
export const ErrorState: Story = {
  args: {
    label: 'Document Category',
    placeholder: 'Select category',
    options: sampleOptions,
    error: 'Please select a document category'
  }
}

// Success state
export const SuccessState: Story = {
  args: {
    label: 'AI Model',
    defaultValue: 'gpt-4',
    options: [
      { value: 'gpt-3.5', label: 'GPT-3.5 Turbo' },
      { value: 'gpt-4', label: 'GPT-4' },
      { value: 'claude', label: 'Claude' }
    ],
    success: 'Model configuration saved successfully'
  }
}

// Warning state
export const WarningState: Story = {
  args: {
    label: 'Processing Method',
    defaultValue: 'legacy',
    options: [
      { value: 'ai', label: 'AI Processing (Recommended)' },
      { value: 'manual', label: 'Manual Review' },
      { value: 'legacy', label: 'Legacy OCR' }
    ],
    warning: 'Legacy OCR has lower accuracy. Consider using AI processing.'
  }
}

// All variants
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8 w-80">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Default Variant</h3>
        <Select
          variant="default"
          label="Document Type"
          placeholder="Select type"
          options={sampleOptions}
          helperText="Standard select styling"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Outlined Variant</h3>
        <Select
          variant="outlined"
          label="Priority Level"
          placeholder="Select priority"
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' }
          ]}
          helperText="Outlined select with thicker border"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filled Variant</h3>
        <Select
          variant="filled"
          label="Status"
          placeholder="Select status"
          options={[
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'pending', label: 'Pending' }
          ]}
          helperText="Filled select with background color"
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
      <Select
        selectSize="sm"
        label="Small Select"
        placeholder="Small size"
        options={sampleOptions}
      />
      
      <Select
        selectSize="md"
        label="Medium Select"
        placeholder="Medium size (default)"
        options={sampleOptions}
      />
      
      <Select
        selectSize="lg"
        label="Large Select"
        placeholder="Large size"
        options={sampleOptions}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// With disabled options
export const WithDisabledOptions: Story = {
  args: {
    label: 'Processing Engine',
    placeholder: 'Select processing engine',
    options: [
      { value: 'openai', label: 'OpenAI GPT-4' },
      { value: 'azure', label: 'Azure Cognitive Services' },
      { value: 'aws', label: 'AWS Textract', disabled: true },
      { value: 'google', label: 'Google Document AI' },
      { value: 'tesseract', label: 'Tesseract OCR', disabled: true }
    ],
    helperText: 'Some engines are temporarily unavailable'
  }
}

// Real-world form example
export const RealWorldForm: Story = {
  render: () => (
    <div className="max-w-md bg-white border border-gray-200 rounded-2xl p-8">
      <h2 className="text-2xl font-light text-gray-900 mb-6">Document Processing Settings</h2>
      <div className="space-y-6">
        <Select
          label="Document Type"
          placeholder="Select document type"
          required
          options={[
            { value: 'invoice', label: 'Invoice' },
            { value: 'receipt', label: 'Receipt' },
            { value: 'contract', label: 'Contract' },
            { value: 'purchase_order', label: 'Purchase Order' },
            { value: 'bank_statement', label: 'Bank Statement' },
            { value: 'other', label: 'Other' }
          ]}
          helperText="This helps our AI choose the best extraction model"
        />
        
        <Select
          label="Processing Priority"
          placeholder="Select priority"
          options={[
            { value: 'low', label: 'Low (24-48 hours)' },
            { value: 'medium', label: 'Medium (4-8 hours)' },
            { value: 'high', label: 'High (1-2 hours)' },
            { value: 'urgent', label: 'Urgent (15-30 minutes)' }
          ]}
          helperText="Higher priority processing costs more"
        />
        
        <Select
          label="Output Format"
          defaultValue="json"
          options={[
            { value: 'json', label: 'JSON (Structured data)' },
            { value: 'csv', label: 'CSV (Spreadsheet)' },
            { value: 'xml', label: 'XML (Markup)' },
            { value: 'pdf', label: 'PDF (Annotated)' }
          ]}
          success="JSON format provides the most flexibility"
        />
        
        <Select
          label="Language Detection"
          placeholder="Auto-detect language"
          options={[
            { value: 'auto', label: 'Auto-detect' },
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
            { value: 'zh', label: 'Chinese' }
          ]}
          helperText="Leave empty for automatic language detection"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}