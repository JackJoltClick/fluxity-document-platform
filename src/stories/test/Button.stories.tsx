import type { Meta, StoryObj } from '@storybook/nextjs'
import { Button } from '../../components/design-system/foundations/Button'

const meta: Meta<typeof Button> = {
  title: 'Test/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
}