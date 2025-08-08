import type { Meta, StoryObj } from '@storybook/react';
import { SchemaActions } from '@/src/components/schemas/SchemaManagement/SchemaActions';
import type { CustomSchema } from '@/src/types/schema';

const meta = {
  title: 'Schemas/SchemaActions',
  component: SchemaActions,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '2rem', position: 'relative', minHeight: '300px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SchemaActions>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSchema: CustomSchema = {
  id: '1',
  user_id: 'user-123',
  name: 'Invoice Processing Schema',
  description: 'Standard invoice processing schema',
  is_active: true,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
};

export const ActiveSchema: Story = {
  args: {
    schema: mockSchema,
  },
};

export const InactiveSchema: Story = {
  args: {
    schema: {
      ...mockSchema,
      is_active: false,
    },
  },
};