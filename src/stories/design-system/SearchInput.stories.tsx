import type { Meta, StoryObj } from '@storybook/nextjs'
import { SearchInput } from '../../components/design-system/forms/SearchInput'
import { useState } from 'react'

const meta: Meta<typeof SearchInput> = {
  title: 'Design System/Forms/SearchInput',
  component: SearchInput,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const SearchInputWrapper = (args: any) => {
  const [value, setValue] = useState('')
  
  return (
    <SearchInput
      {...args}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onClear={() => setValue('')}
    />
  )
}

export const Default: Story = {
  render: (args) => <SearchInputWrapper {...args} />,
  args: {
    placeholder: 'Search...'
  },
}

export const LeftIcon: Story = {
  render: (args) => <SearchInputWrapper {...args} />,
  args: {
    placeholder: 'Search users...',
    iconPosition: 'left'
  },
}

export const Clearable: Story = {
  render: (args) => <SearchInputWrapper {...args} />,
  args: {
    placeholder: 'Search with clear button...',
    clearable: true
  },
}

export const Loading: Story = {
  render: (args) => <SearchInputWrapper {...args} />,
  args: {
    placeholder: 'Searching...',
    loading: true
  },
}

export const CustomIcon: Story = {
  render: (args) => <SearchInputWrapper {...args} />,
  args: {
    placeholder: 'Search documents...',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  },
}

export const Disabled: Story = {
  render: (args) => <SearchInputWrapper {...args} />,
  args: {
    placeholder: 'Search disabled...',
    disabled: true
  },
}