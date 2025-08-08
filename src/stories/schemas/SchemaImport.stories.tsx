import type { Meta, StoryObj } from '@storybook/react';
import { SchemaImport } from '@/src/components/schemas/SchemaBuilder/SchemaImport';

const meta = {
  title: 'Schemas/SchemaImport',
  component: SchemaImport,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onSuccess: { action: 'import-success' },
    onCancel: { action: 'import-cancelled' },
  },
} satisfies Meta<typeof SchemaImport>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCallbacks: Story = {
  args: {
    onSuccess: () => console.log('Import successful!'),
    onCancel: () => console.log('Import cancelled'),
  },
};