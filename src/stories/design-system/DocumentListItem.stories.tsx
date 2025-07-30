import React from 'react'
import type { Meta, StoryObj } from '@storybook/nextjs'
import { DocumentListItem } from '../../components/design-system/dashboard/DocumentListItem'

const sampleDocuments = [
  { 
    id: 1, 
    name: 'Invoice_Q1_2024.pdf', 
    vendor: 'Amazon Web Services', 
    amount: 2459.00, 
    status: 'processed' as const, 
    date: '2 hours ago' 
  },
  { 
    id: 2, 
    name: 'Receipt_Office_Supplies.pdf', 
    vendor: 'Office Depot', 
    amount: 847.32, 
    status: 'pending' as const, 
    date: '4 hours ago' 
  },
  { 
    id: 3, 
    name: 'Invoice_Software_License.pdf', 
    vendor: 'Microsoft', 
    amount: 15699.00, 
    status: 'processing' as const, 
    date: '6 hours ago' 
  },
  { 
    id: 4, 
    name: 'Travel_Expense_Report.pdf', 
    vendor: 'Delta Airlines', 
    amount: 1234.56, 
    status: 'error' as const, 
    date: '1 day ago' 
  },
  { 
    id: 5, 
    name: 'Contract_NDA_Legal.pdf', 
    vendor: 'Law Firm Partners', 
    status: 'processed' as const, 
    date: '2 days ago' 
  }
]

const PdfIcon = () => (
  <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
  </svg>
)

const ImageIcon = () => (
  <svg className="w-6 h-6 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
  </svg>
)

const meta: Meta<typeof DocumentListItem> = {
  title: 'Design System/Dashboard/DocumentListItem',
  component: DocumentListItem,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Document list item component for displaying document information with status, vendor, and amount following Square design philosophy.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    clickable: {
      control: 'boolean',
      description: 'Whether the item is clickable'
    },
    href: {
      control: 'text',
      description: 'Custom link href'
    },
    document: {
      description: 'Document data object'
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

// Processed document
export const Processed: Story = {
  args: {
    document: sampleDocuments[0],
    onItemClick: (doc) => console.log('Clicked document:', doc.name)
  }
}

// Pending document
export const Pending: Story = {
  args: {
    document: sampleDocuments[1],
    onItemClick: (doc) => console.log('Clicked document:', doc.name)
  }
}

// Processing document
export const Processing: Story = {
  args: {
    document: sampleDocuments[2],
    onItemClick: (doc) => console.log('Clicked document:', doc.name)
  }
}

// Error document
export const Error: Story = {
  args: {
    document: sampleDocuments[3],
    onItemClick: (doc) => console.log('Clicked document:', doc.name)
  }
}

// Document without amount
export const NoAmount: Story = {
  args: {
    document: sampleDocuments[4],
    onItemClick: (doc) => console.log('Clicked document:', doc.name)
  }
}

// Custom icon
export const CustomIcon: Story = {
  args: {
    document: sampleDocuments[0],
    icon: <PdfIcon />,
    onItemClick: (doc) => console.log('Clicked document:', doc.name)
  }
}

// Non-clickable
export const NonClickable: Story = {
  args: {
    document: sampleDocuments[0],
    clickable: false
  }
}

// Document list showcase
export const DocumentList: Story = {
  render: () => (
    <div className="max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-light text-gray-900 tracking-tight">Recent Activity</h3>
          <a href="#" className="text-sm text-gray-700 hover:text-gray-900 font-medium transition-colors">
            View all →
          </a>
        </div>
      </div>
      
      <div className="divide-y divide-gray-50">
        {sampleDocuments.map((doc) => (
          <DocumentListItem
            key={doc.id}
            document={doc}
            onItemClick={(document) => console.log('Clicked:', document.name)}
          />
        ))}
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Different icons showcase
export const IconVariations: Story = {
  render: () => (
    <div className="max-w-4xl bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="px-8 py-6 border-b border-gray-100">
        <h3 className="text-2xl font-light text-gray-900 tracking-tight">Document Types</h3>
      </div>
      
      <div className="divide-y divide-gray-50">
        <DocumentListItem
          document={{
            id: 'pdf1',
            name: 'Annual_Report_2024.pdf',
            vendor: 'Corporate Finance',
            amount: 0,
            status: 'processed',
            date: '1 hour ago'
          }}
          icon={<PdfIcon />}
        />
        
        <DocumentListItem
          document={{
            id: 'img1',
            name: 'Receipt_Scan_001.jpg',
            vendor: 'Coffee Shop',
            amount: 15.47,
            status: 'processing',
            date: '3 hours ago'
          }}
          icon={<ImageIcon />}
        />
        
        <DocumentListItem
          document={{
            id: 'doc1',
            name: 'Contract_Amendment.docx',
            vendor: 'Legal Department',
            status: 'pending',
            date: '5 hours ago'
          }}
          icon={
            <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          }
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
  }
}

// Interactive example with state
export const InteractiveList: Story = {
  render: () => {
    const [selectedDoc, setSelectedDoc] = React.useState<string | null>(null)
    
    return (
      <div className="max-w-4xl space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-2xl font-light text-gray-900 tracking-tight">Interactive Document List</h3>
            {selectedDoc && (
              <p className="text-sm text-gray-500 mt-2">
                Selected: {selectedDoc}
              </p>
            )}
          </div>
          
          <div className="divide-y divide-gray-50">
            {sampleDocuments.slice(0, 3).map((doc) => (
              <DocumentListItem
                key={doc.id}
                document={doc}
                onItemClick={(document) => setSelectedDoc(document.name)}
                className={selectedDoc === doc.name ? 'bg-blue-50' : ''}
              />
            ))}
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    layout: 'padded',
  }
}