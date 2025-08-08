import type { Meta, StoryObj } from '@storybook/react';
import { SchemaProgress } from '@/src/components/schemas/SchemaBuilder/SchemaProgress';

const meta = {
  title: 'Schemas/SchemaProgress',
  component: SchemaProgress,
  parameters: {
    layout: 'padded',
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'white', padding: '1rem', borderRadius: '8px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SchemaProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FirstField: Story = {
  args: {
    currentStep: 1,
    totalSteps: 22,
    fieldName: 'Invoice Number',
  },
};

export const MiddleField: Story = {
  args: {
    currentStep: 10,
    totalSteps: 22,
    fieldName: 'Total Amount',
  },
};

export const LastField: Story = {
  args: {
    currentStep: 20,
    totalSteps: 22,
    fieldName: 'Notes',
  },
};

export const BusinessRules: Story = {
  args: {
    currentStep: 21,
    totalSteps: 22,
  },
};

export const ReviewAndSave: Story = {
  args: {
    currentStep: 22,
    totalSteps: 22,
  },
};