import type { Meta, StoryObj } from '@storybook/nextjs'
import { Alert, Toast } from '../../components/design-system/feedback/Alert'
import { useState } from 'react'

const meta: Meta<typeof Alert> = {
  title: 'Design System/Feedback/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>
type ToastStory = StoryObj<typeof Toast>

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'This is an informational alert with some important details.',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Success',
    children: 'Your action has been completed successfully!',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Warning',
    children: 'Please review the following items before proceeding.',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Error',
    children: 'An error occurred while processing your request.',
  },
}

export const Dismissible: Story = {
  render: (args) => {
    const [visible, setVisible] = useState(true)
    
    if (!visible) {
      return (
        <button 
          onClick={() => setVisible(true)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Show Alert
        </button>
      )
    }
    
    return (
      <Alert
        {...args}
        onDismiss={() => setVisible(false)}
      />
    )
  },
  args: {
    variant: 'info',
    title: 'Dismissible Alert',
    children: 'Click the X button to dismiss this alert.',
    dismissible: true,
  },
}

export const WithoutIcon: Story = {
  args: {
    variant: 'warning',
    title: 'Alert without Icon',
    children: 'This alert does not show an icon.',
    showIcon: false,
  },
}

export const CustomIcon: Story = {
  args: {
    variant: 'info',
    title: 'Custom Icon',
    children: 'This alert uses a custom icon.',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
}

export const Large: Story = {
  args: {
    variant: 'success',
    title: 'Large Alert',
    children: 'This is a larger alert with more prominent styling.',
    size: 'lg',
  },
}

export const Small: Story = {
  args: {
    variant: 'error',
    title: 'Small Alert',
    children: 'This is a compact alert.',
    size: 'sm',
  },
}

// Toast Stories
const ToastWrapper = ({ position, ...args }: any) => {
  const [showToast, setShowToast] = useState(false)
  
  return (
    <>
      <button 
        onClick={() => setShowToast(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md"
      >
        Show Toast
      </button>
      {showToast && (
        <Toast
          {...args}
          position={position}
          onDismiss={() => setShowToast(false)}
        />
      )}
    </>
  )
}

export const ToastSuccess: Story = {
  render: (args) => <ToastWrapper {...args} position="top-right" />,
  args: {
    variant: 'success',
    title: 'Success Toast',
    children: 'Your changes have been saved!',
  },
}

export const ToastError: Story = {
  render: (args) => <ToastWrapper {...args} position="top-right" />,
  args: {
    variant: 'error',
    title: 'Error Toast',
    children: 'Something went wrong. Please try again.',
  },
}

export const ToastBottomLeft: Story = {
  render: (args) => <ToastWrapper {...args} position="bottom-left" />,
  args: {
    variant: 'info',
    title: 'Info Toast',
    children: 'This toast appears in the bottom left corner.',
  },
}