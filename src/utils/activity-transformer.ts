interface Document {
  id: string
  filename: string
  status: string
  supplier_name?: string
  total_amount?: number
  created_at: string
  updated_at?: string
}

interface ActivityItem {
  id: string
  type: 'document_uploaded' | 'document_processed' | 'document_exported' | 'vendor_created'
  title: string
  subtitle: string
  timestamp: string
  metadata?: {
    amount?: number
    status?: string
    vendor?: string
    filename?: string
  }
  href?: string
}

const formatRelativeTime = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return 'just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}

const getDocumentActivityType = (status: string): ActivityItem['type'] => {
  switch (status) {
    case 'uploaded':
    case 'pending':
      return 'document_uploaded'
    case 'processing':
      return 'document_uploaded' // Still in upload/processing phase
    case 'completed':
    case 'processed':
      return 'document_processed'
    case 'exported':
      return 'document_exported'
    default:
      return 'document_uploaded'
  }
}

const generateActivityTitle = (doc: Document): string => {
  const type = getDocumentActivityType(doc.status)
  const fileName = doc.filename.length > 30 
    ? `${doc.filename.substring(0, 27)}...` 
    : doc.filename
  
  switch (type) {
    case 'document_uploaded':
      return doc.status === 'processing' 
        ? `Processing ${fileName}`
        : `Uploaded ${fileName}`
    case 'document_processed':
      return `Processed ${fileName}`
    case 'document_exported':
      return `Exported ${fileName}`
    default:
      return `Updated ${fileName}`
  }
}

const generateActivitySubtitle = (doc: Document): string => {
  const type = getDocumentActivityType(doc.status)
  const vendor = doc.supplier_name || 'Unknown vendor'
  const amount = doc.total_amount 
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(doc.total_amount)
    : null
  
  switch (type) {
    case 'document_uploaded':
      return doc.status === 'processing' 
        ? 'AI is extracting data from your document'
        : 'Document uploaded and queued for processing'
    case 'document_processed':
      if (amount && vendor !== 'Unknown vendor') {
        return `${vendor} • ${amount} • Ready for review`
      } else if (vendor !== 'Unknown vendor') {
        return `${vendor} • Data extracted successfully`
      } else {
        return 'Data extraction completed'
      }
    case 'document_exported':
      return `${vendor} • Successfully exported to accounting system`
    default:
      return 'Document updated'
  }
}

export const transformDocumentsToActivity = (documents: Document[]): ActivityItem[] => {
  return documents
    .slice(0, 5) // Show latest 5 activities
    .map((doc) => ({
      id: `doc-${doc.id}`,
      type: getDocumentActivityType(doc.status),
      title: generateActivityTitle(doc),
      subtitle: generateActivitySubtitle(doc),
      timestamp: formatRelativeTime(doc.updated_at || doc.created_at),
      metadata: {
        amount: doc.total_amount,
        status: doc.status,
        vendor: doc.supplier_name,
        filename: doc.filename
      },
      href: `/documents/${doc.id}`
    }))
}

// Future enhancement: Mix document activities with other types
export const createMixedActivityFeed = (
  documents: Document[],
  // vendors?: Vendor[],
  // exports?: Export[]
): ActivityItem[] => {
  const documentActivities = transformDocumentsToActivity(documents)
  
  // Future: Add vendor creation activities, export activities, etc.
  // const vendorActivities = vendors?.map(vendor => ({ ... })) || []
  // const exportActivities = exports?.map(exp => ({ ... })) || []
  
  // Combine and sort by timestamp
  const allActivities = [
    ...documentActivities,
    // ...vendorActivities,
    // ...exportActivities
  ]
  
  return allActivities
    .sort((a, b) => {
      // For now, documents are already sorted by created_at desc
      // In future, parse timestamps and sort properly
      return 0
    })
    .slice(0, 6) // Show top 6 activities
}