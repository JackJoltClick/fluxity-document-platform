import type { Meta, StoryObj } from '@storybook/nextjs'
import { FormField, EnhancedInput, EnhancedTextarea } from '../../components/design-system/forms/FormField'
import { Select } from '../../components/design-system/forms/Select'

const meta: Meta<typeof FormField> = {
  title: 'Design System/Forms/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const BasicInput: Story = {
  args: {
    id: 'email',
    label: 'Email Address',
    required: true,
    helpText: 'We will never share your email with anyone else.',
    children: (
      <EnhancedInput
        id="email"
        type="email"
        placeholder="Enter your email"
      />
    )
  },
}

export const WithError: Story = {
  args: {
    id: 'password',
    label: 'Password',
    required: true,
    error: 'Password must be at least 8 characters long',
    children: (
      <EnhancedInput
        id="password"
        type="password"
        placeholder="Enter your password"
        hasError={true}
      />
    )
  },
}

export const WithLeftIcon: Story = {
  args: {
    id: 'search',
    label: 'Search',
    children: (
      <EnhancedInput
        id="search"
        type="text"
        placeholder="Search..."
        leftIcon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
    )
  },
}

export const WithRightIcon: Story = {
  args: {
    id: 'amount',
    label: 'Amount',
    children: (
      <EnhancedInput
        id="amount"
        type="number"
        placeholder="0.00"
        rightIcon={
          <span className="text-gray-500 text-sm">USD</span>
        }
      />
    )
  },
}

export const TextareaField: Story = {
  args: {
    id: 'description',
    label: 'Description',
    helpText: 'Provide a detailed description of the issue.',
    children: (
      <EnhancedTextarea
        id="description"
        rows={4}
        placeholder="Enter description..."
      />
    )
  },
}

export const SelectField: Story = {
  args: {
    id: 'category',
    label: 'Category',
    required: true,
    children: (
      <Select
        id="category"
        placeholder="Select a category"
        options={[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
          { value: 'transfer', label: 'Transfer' },
        ]}
      />
    )
  },
}

export const Disabled: Story = {
  args: {
    id: 'readonly',
    label: 'Read-only Field',
    disabled: true,
    children: (
      <EnhancedInput
        id="readonly"
        type="text"
        value="This field is disabled"
        disabled={true}
      />
    )
  },
}

export const SmallSize: Story = {
  args: {
    id: 'code',
    label: 'Code',
    children: (
      <EnhancedInput
        id="code"
        type="text"
        placeholder="Enter code"
        inputSize="sm"
      />
    )
  },
}

export const LargeSize: Story = {
  args: {
    id: 'title',
    label: 'Title',
    children: (
      <EnhancedInput
        id="title"
        type="text"
        placeholder="Enter title"
        inputSize="lg"
      />
    )
  },
}