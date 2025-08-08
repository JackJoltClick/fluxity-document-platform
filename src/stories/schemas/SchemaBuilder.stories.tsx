import type { Meta, StoryObj } from '@storybook/react';
import { SchemaBuilder } from '@/src/components/schemas/SchemaBuilder/SchemaBuilder';

const meta = {
  title: 'Schemas/SchemaBuilder',
  component: SchemaBuilder,
  parameters: {
    layout: 'fullscreen',
    // This story needs the full viewport
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  argTypes: {
    onComplete: { action: 'schema-completed' },
    onCancel: { action: 'schema-cancelled' },
  },
} satisfies Meta<typeof SchemaBuilder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCallbacks: Story = {
  args: {
    onComplete: () => console.log('Schema creation completed!'),
    onCancel: () => console.log('Schema creation cancelled'),
  },
};

export const FullScreenDemo: Story = {
  args: {},
  parameters: {
    docs: {
      story: {
        inline: false,
        height: '100vh',
      },
    },
  },
};