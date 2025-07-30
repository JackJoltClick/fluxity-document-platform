import type { Meta, StoryObj } from '@storybook/nextjs'
import { FileUploadDropzone } from '../../components/design-system/forms/FileUploadDropzone'
import { useForm } from 'react-hook-form'
import { useState } from 'react'

const meta: Meta<typeof FileUploadDropzone> = {
  title: 'Design System/Forms/FileUploadDropzone',
  component: FileUploadDropzone,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const FileUploadWrapper = (args: any) => {
  const { register, setValue, trigger, watch } = useForm()
  const [error, setError] = useState<string | undefined>()
  
  const watchedFile = watch('file')
  const selectedFile = watchedFile?.[0] || null

  return (
    <FileUploadDropzone
      {...args}
      register={register('file')}
      setValue={setValue}
      trigger={trigger}
      fieldName="file"
      selectedFile={selectedFile}
      error={error}
    />
  )
}

export const Default: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {},
}

export const WithError: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    error: 'File size must be less than 50MB',
  },
}

export const Disabled: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    disabled: true,
  },
}

export const CustomConfig: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    placeholder: 'Drop your invoice here',
    supportedFormats: 'PDF only',
    maxSize: 10 * 1024 * 1024, // 10MB
    accept: '.pdf',
  },
}