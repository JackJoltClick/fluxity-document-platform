import type { Meta, StoryObj } from '@storybook/nextjs'
import { DataTable, DataTableColumn, DataTableAction } from '../../components/design-system/layout/DataTable'

const meta = {
  title: 'Design System/Layout/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DataTable>

export default meta
type Story = StoryObj<typeof meta>

interface SampleData {
  id: string
  name: string
  email: string
  role: string
  status: 'active' | 'inactive'
  joinDate: string
}

const sampleData: SampleData[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
    status: 'active',
    joinDate: '2023-01-15'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'User',
    status: 'active',
    joinDate: '2023-02-20'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'User',
    status: 'inactive',
    joinDate: '2023-03-10'
  }
]

const columns: DataTableColumn<SampleData>[] = [
  {
    key: 'name',
    label: 'Name',
    render: (item: SampleData) => (
      <div className="font-medium text-gray-900">{item.name}</div>
    )
  },
  {
    key: 'email',
    label: 'Email',
    render: (item: SampleData) => (
      <div className="text-gray-600">{item.email}</div>
    )
  },
  {
    key: 'role',
    label: 'Role',
    render: (item: SampleData) => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        {item.role}
      </span>
    )
  },
  {
    key: 'status',
    label: 'Status',
    render: (item: SampleData) => (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        item.status === 'active' 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {item.status}
      </span>
    )
  },
  {
    key: 'joinDate',
    label: 'Join Date',
    render: (item: SampleData) => (
      <div className="text-gray-600">{new Date(item.joinDate).toLocaleDateString()}</div>
    )
  }
]

const actions: DataTableAction<SampleData>[] = [
  {
    key: 'edit',
    label: 'Edit',
    onClick: (item: SampleData) => alert(`Edit ${item.name}`),
    variant: 'primary' as const
  },
  {
    key: 'delete',
    label: 'Delete',
    onClick: (item: SampleData) => alert(`Delete ${item.name}`),
    variant: 'danger' as const,
    disabled: (item: SampleData) => item.role === 'Admin'
  }
]

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns as any,
    actions: actions as any,
    getRowKey: (item: any) => item.id,
    caption: 'User Management'
  },
}

export const Loading: Story = {
  args: {
    data: [],
    columns: columns as any,
    actions: actions as any,
    getRowKey: (item: any) => item.id,
    loading: true,
    caption: 'Loading Users'
  },
}

export const Empty: Story = {
  args: {
    data: [],
    columns: columns as any,
    actions: actions as any,
    getRowKey: (item: any) => item.id,
    emptyMessage: 'No users found',
    emptyIcon: '👥',
    caption: 'User Management'
  },
}

export const WithoutActions: Story = {
  args: {
    data: sampleData,
    columns: columns as any,
    getRowKey: (item: any) => item.id,
    caption: 'Read-only Table'
  },
}

export const NoHover: Story = {
  args: {
    data: sampleData,
    columns: columns as any,
    actions: actions as any,
    getRowKey: (item: any) => item.id,
    hoverable: false,
    caption: 'Static Table'
  },
}