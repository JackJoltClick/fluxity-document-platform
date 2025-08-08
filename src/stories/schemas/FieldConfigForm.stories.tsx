import type { Meta, StoryObj } from '@storybook/react';
import { FieldConfigForm } from '@/src/components/schemas/SchemaBuilder/FieldConfigForm';
import type { SchemaField } from '@/src/types/schema';

const meta = {
  title: 'Schemas/FieldConfigForm',
  component: FieldConfigForm,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <Story />
        </div>
      </div>
    ),
  ],
  argTypes: {
    onUpdate: { action: 'field-updated' },
  },
} satisfies Meta<typeof FieldConfigForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const baseField: Partial<SchemaField> = {
  field_name: 'Invoice Number',
  field_order: 1,
  alternative_names: ['Invoice ID', 'Inv #', 'Reference'],
  data_format: '10 digits, starts with "INV-"',
  typical_locations: ['top_right', 'header'],
  case_sensitive: false,
  business_purpose: 'Primary identifier for tracking invoices in our ERP system',
  examples: ['INV-2024001', 'INV-2024002', 'INV-2024003'],
  default_value: 'AUTO-GENERATED',
  matching_list_type: 'vendors',
  document_types: ['invoices', 'statements'],
  is_required: true,
};

export const FirstField: Story = {
  args: {
    field: baseField,
    fieldNumber: 1,
    totalFields: 20,
  },
};

export const MiddleField: Story = {
  args: {
    field: {
      ...baseField,
      field_name: 'Total Amount',
      field_order: 10,
      alternative_names: ['Total', 'Amount Due', 'Grand Total'],
      data_format: 'Currency format with 2 decimal places',
      typical_locations: ['near_total', 'footer'],
      business_purpose: 'The total amount to be paid for the invoice',
      examples: ['$1,234.56', '$999.99', '$10,500.00'],
      default_value: undefined,
      matching_list_type: undefined,
    },
    fieldNumber: 10,
    totalFields: 20,
  },
};

export const LastField: Story = {
  args: {
    field: {
      field_name: 'Notes',
      field_order: 20,
      alternative_names: ['Comments', 'Additional Information'],
      typical_locations: ['footer', 'other'],
      case_sensitive: false,
      document_types: ['invoices', 'purchase_orders', 'receipts'],
      is_required: false,
    },
    fieldNumber: 20,
    totalFields: 20,
  },
};

export const EmptyField: Story = {
  args: {
    field: {
      field_name: 'New Field',
      field_order: 1,
      alternative_names: [],
      typical_locations: [],
      case_sensitive: false,
      examples: [],
      document_types: ['invoices'],
      is_required: false,
    },
    fieldNumber: 1,
    totalFields: 20,
  },
};

export const ComplexField: Story = {
  args: {
    field: {
      field_name: 'GL Account Code',
      field_order: 15,
      alternative_names: ['Account', 'GL Code', 'Account Number'],
      data_format: '4 digits - 3 digits (e.g., 5000-100)',
      typical_locations: ['table', 'near_total'],
      case_sensitive: false,
      business_purpose: 'General Ledger account for categorizing expenses',
      examples: ['5000-100', '6000-200', '7000-300'],
      default_value: '5000-000',
      matching_list_type: 'gl_accounts',
      document_types: ['invoices', 'purchase_orders'],
      is_required: true,
      conditional_rules: [
        {
          id: '1',
          condition_field: 'vendor',
          condition_operator: 'contains',
          condition_value: 'Office Supplies',
          action_type: 'set_value',
          action_value: '5100-000',
        },
      ],
    },
    fieldNumber: 15,
    totalFields: 20,
  },
};