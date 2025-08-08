import type { Meta, StoryObj } from '@storybook/react';
import { SchemaCard } from '@/src/components/schemas/SchemaManagement/SchemaCard';
import type { CustomSchema } from '@/src/types/schema';

const meta = {
  title: 'Schemas/SchemaCard',
  component: SchemaCard,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: '400px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SchemaCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSchema: CustomSchema = {
  id: '1',
  user_id: 'user-123',
  name: 'Invoice Processing Schema',
  description: 'Standard invoice processing with vendor and GL account mapping for automated data extraction',
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  fields: Array(20).fill(null).map((_, i) => ({
    id: `field-${i}`,
    schema_id: '1',
    field_name: `Field ${i + 1}`,
    field_order: i + 1,
    alternative_names: [],
    typical_locations: [],
    case_sensitive: false,
    examples: [],
    document_types: ['invoices'],
    is_required: i < 5,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  })),
};

export const Active: Story = {
  args: {
    schema: mockSchema,
  },
};

export const Inactive: Story = {
  args: {
    schema: {
      ...mockSchema,
      is_active: false,
      name: 'Purchase Order Schema',
      description: 'Purchase order processing with cost center tracking',
    },
  },
};

export const NoDescription: Story = {
  args: {
    schema: {
      ...mockSchema,
      description: undefined,
      name: 'Minimal Schema',
    },
  },
};

export const FewFields: Story = {
  args: {
    schema: {
      ...mockSchema,
      name: 'Simple Receipt Schema',
      description: 'Basic receipt processing',
      fields: mockSchema.fields?.slice(0, 3),
    },
  },
};