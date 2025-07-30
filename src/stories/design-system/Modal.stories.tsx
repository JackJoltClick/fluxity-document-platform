import type { Meta, StoryObj } from '@storybook/nextjs'
import { Modal, ModalBody, ModalFooter } from '../../components/design-system/layout/Modal'
import { Button } from '../../components/design-system/foundations/Button'
import { useState } from 'react'

const meta: Meta<typeof Modal> = {
  title: 'Design System/Layout/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const ModalWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <Modal
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

export const Default: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Default Modal',
    children: (
      <ModalBody>
        <p>This is a basic modal with default settings.</p>
      </ModalBody>
    )
  },
}

export const WithFooter: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Modal with Footer',
    children: (
      <ModalBody>
        <p>This modal includes a footer with action buttons.</p>
      </ModalBody>
    ),
    footer: (
      <ModalFooter>
        <Button variant="secondary">Cancel</Button>
        <Button>Confirm</Button>
      </ModalFooter>
    )
  },
}

export const Large: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'Large Modal',
    size: 'lg',
    children: (
      <ModalBody>
        <div className="space-y-4">
          <p>This is a large modal with more content space.</p>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <p>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        </div>
      </ModalBody>
    )
  },
}

export const CustomHeader: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    header: (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Custom Header</h2>
          <p className="text-sm text-gray-500">With subtitle and icon</p>
        </div>
      </div>
    ),
    children: (
      <ModalBody>
        <p>This modal has a custom header with an icon and subtitle.</p>
      </ModalBody>
    )
  },
}

export const NoCloseButton: Story = {
  render: (args) => <ModalWrapper {...args} />,
  args: {
    title: 'No Close Button',
    showCloseButton: false,
    closeOnBackdropClick: false,
    closeOnEscape: false,
    children: (
      <ModalBody>
        <p>This modal can only be closed using the footer buttons.</p>
      </ModalBody>
    ),
    footer: (
      <ModalFooter>
        <Button variant="secondary">Cancel</Button>
        <Button>Save</Button>
      </ModalFooter>
    )
  },
}