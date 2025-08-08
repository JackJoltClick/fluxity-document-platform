import type { Meta, StoryObj } from '@storybook/react';
import { SchemaList } from '@/src/components/schemas/SchemaManagement/SchemaList';
import type { CustomSchema } from '@/src/types/schema';

const meta = {
  title: 'Schemas/SchemaList',
  component: SchemaList,
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof SchemaList>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSchemas: CustomSchema[] = [
  {
    id: '1',
    user_id: 'user-123',
    name: 'Invoice Processing Schema',
    description: 'Standard invoice processing with vendor and GL account mapping',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    fields: Array(20).fill(null),
  },
  {
    id: '2',
    user_id: 'user-123',
    name: 'Purchase Order Schema',
    description: 'Purchase order processing with cost center tracking and approval workflows',
    is_active: false,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
    fields: Array(15).fill(null),
  },
  {
    id: '3',
    user_id: 'user-123',
    name: 'Receipt Schema',
    description: 'Simple receipt processing for expense tracking',
    is_active: true,
    created_at: '2024-01-05T14:00:00Z',
    updated_at: '2024-01-12T16:30:00Z',
    fields: Array(8).fill(null),
  },
];

export const WithSchemas: Story = {
  args: {
    schemas: mockSchemas,
  },
};

export const EmptyState: Story = {
  args: {
    schemas: [],
  },
};

export const SingleSchema: Story = {
  args: {
    schemas: [mockSchemas[0]],
  },
};

export const ManySchemas: Story = {
  args: {
    schemas: Array(9).fill(null).map((_, i) => ({
      id: `schema-${i}`,
      user_id: 'user-123',
      name: `Schema ${i + 1}`,
      description: `Description for schema ${i + 1}`,
      is_active: i % 3 !== 0,
      created_at: new Date(2024, 0, i + 1).toISOString(),
      updated_at: new Date(2024, 0, i + 1).toISOString(),
      fields: Array(Math.floor(Math.random() * 20) + 5).fill(null),
    })),
  },
};