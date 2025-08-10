'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import { PageHeader } from '@/src/components/design-system/layout/PageHeader'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'
import { ErrorState } from '@/src/components/design-system/feedback/ErrorState'
import { EmptyState } from '@/src/components/design-system/feedback/EmptyState'
import { Button } from '@/src/components/design-system/foundations/Button'
import { FieldConfidenceGroup } from '@/src/components/extraction/FieldConfidenceIndicator'
import { 
  CheckCircleIcon, 
  XMarkIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface DocumentForReview {
  id: string
  filename: string
  created_at: string
  overall_confidence: number
  extraction_models: string[]
  validation_errors: any[]
  extracted_data: any
  model_confidences: any
  extraction_consensus: any
  status: string
}

export default function DocumentReviewQueue() {
  const [documents, setDocuments] = useState<DocumentForReview[]>([])
  const [currentDoc, setCurrentDoc] = useState<DocumentForReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchDocumentsForReview()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchDocumentsForReview = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('documents')
        .select('*')
        .eq('requires_review', true)
        .is('reviewed_at', null)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20)

      if (fetchError) throw fetchError

      setDocuments(data || [])
      if (data && data.length > 0 && !currentDoc) {
        setCurrentDoc(data[0])
      }
    } catch (err) {
      console.error('Error fetching review queue:', err)
      setError(err instanceof Error ? err.message : 'Failed to load review queue')
    } finally {
      setLoading(false)
    }
  }

  const markAsReviewed = async (documentId: string, notes?: string) => {
    try {
      setSaving(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: updateError } = await supabase
        .from('documents')
        .update({
          requires_review: false,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          review_notes: notes
        })
        .eq('id', documentId)

      if (updateError) throw updateError

      // Remove from list and move to next
      const newDocs = documents.filter(d => d.id !== documentId)
      setDocuments(newDocs)
      
      if (newDocs.length > 0) {
        setCurrentDoc(newDocs[0])
      } else {
        setCurrentDoc(null)
      }
    } catch (err) {
      console.error('Error marking as reviewed:', err)
      alert('Failed to mark document as reviewed')
    } finally {
      setSaving(false)
    }
  }

  const skipDocument = () => {
    const currentIndex = documents.findIndex(d => d.id === currentDoc?.id)
    const nextIndex = (currentIndex + 1) % documents.length
    if (documents[nextIndex]) {
      setCurrentDoc(documents[nextIndex])
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Review Queue"
          subtitle="Review and validate extracted data"
          status={{
            type: 'processing',
            label: 'Loading queue...',
            animated: true
          }}
        />
        <LoadingState
          variant="spinner"
          size="lg"
          message="Loading documents for review..."
          centered
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Review Queue"
          subtitle="Review and validate extracted data"
          status={{
            type: 'error',
            label: 'Error loading queue'
          }}
        />
        <ErrorState
          title="Failed to load review queue"
          message={error}
        />
        <div className="mt-4 flex justify-center">
          <Button
            onClick={fetchDocumentsForReview}
            variant="primary"
            size="md"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Document Review Queue"
          subtitle="Review and validate extracted data"
          status={{
            type: 'operational',
            label: 'Queue empty'
          }}
        />
        <EmptyState
          title="No documents need review"
          description="All documents have been reviewed or have high confidence scores"
        />
        <div className="mt-4 flex justify-center">
          <Button
            onClick={fetchDocumentsForReview}
            variant="outline"
            size="md"
          >
            Refresh Queue
          </Button>
        </div>
      </div>
    )
  }

  const prepareFieldsForDisplay = (doc: DocumentForReview) => {
    const fields: any[] = []
    const extractedData = doc.extracted_data || {}
    const consensus = doc.extraction_consensus || {}
    const validationErrors = doc.validation_errors || []

    Object.keys(extractedData).forEach(fieldName => {
      const value = extractedData[fieldName]
      const consensusData = consensus[fieldName] || {}
      const fieldErrors = validationErrors.filter((e: any) => e.field === fieldName)
      
      fields.push({
        fieldName,
        value: typeof value === 'object' && value?.value !== undefined ? value.value : value,
        confidence: typeof value === 'object' && value?.confidence !== undefined 
          ? value.confidence 
          : consensusData.confidence || 0.5,
        source: consensusData.source || 'unknown',
        agreement: consensusData.agreement,
        validationStatus: fieldErrors.some((e: any) => e.severity === 'critical') ? 'error' :
                         fieldErrors.some((e: any) => e.severity === 'warning') ? 'warning' :
                         'valid',
        validationMessage: fieldErrors.map((e: any) => e.issue).join(', ')
      })
    })

    return fields
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Document Review Queue"
        subtitle={`${documents.length} documents need review`}
        status={{
          type: 'warning',
          label: `${documents.length} pending`,
          animated: true
        }}
      />
      <div className="mb-4 flex justify-end">
        <Button
          onClick={fetchDocumentsForReview}
          variant="outline"
          size="sm"
        >
          Refresh Queue
        </Button>
      </div>

      {currentDoc && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {/* Document Header */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-light text-gray-900">
                  {currentDoc.filename}
                </h2>
                <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                  <span>
                    Overall Confidence: {(currentDoc.overall_confidence * 100).toFixed(1)}%
                  </span>
                  <span>
                    Models: {currentDoc.extraction_models?.join(', ') || 'Unknown'}
                  </span>
                  <span>
                    Errors: {currentDoc.validation_errors?.length || 0}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={skipDocument}
                  variant="outline"
                  size="sm"
                  disabled={documents.length <= 1}
                >
                  Skip
                </Button>
                <Button
                  onClick={() => markAsReviewed(currentDoc.id, 'Reviewed and approved')}
                  variant="success"
                  size="sm"
                  loading={saving}
                  icon={<CheckCircleIcon className="w-4 h-4" />}
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {currentDoc.validation_errors && currentDoc.validation_errors.length > 0 && (
            <div className="px-8 py-4 bg-red-50 border-b border-red-100">
              <h3 className="text-sm font-semibold text-red-700 mb-2">
                Validation Issues
              </h3>
              <ul className="space-y-1">
                {currentDoc.validation_errors.map((error: any, idx: number) => (
                  <li key={idx} className="text-sm text-red-600">
                    • {error.field}: {error.issue}
                    {error.suggestion && (
                      <span className="text-red-500 ml-2">
                        (Suggestion: {error.suggestion})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Extracted Fields */}
          <div className="px-8 py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Extracted Data
            </h3>
            <FieldConfidenceGroup
              fields={prepareFieldsForDisplay(currentDoc)}
            />
          </div>

          {/* Actions */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Document {documents.findIndex(d => d.id === currentDoc.id) + 1} of {documents.length}
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => window.open(`/documents/${currentDoc.id}`, '_blank')}
                  variant="outline"
                  size="md"
                  icon={<DocumentMagnifyingGlassIcon className="w-4 h-4" />}
                >
                  View Full Document
                </Button>
                
                <Button
                  onClick={() => {
                    if (confirm('Mark this document as needing correction?')) {
                      markAsReviewed(currentDoc.id, 'Needs correction')
                    }
                  }}
                  variant="danger"
                  size="md"
                  icon={<XMarkIcon className="w-4 h-4" />}
                >
                  Needs Correction
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Overview */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-8 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Review Queue Overview
          </h3>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-light text-gray-900">
                {documents.length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Documents Pending
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-light text-yellow-600">
                {documents.filter(d => (d.overall_confidence || 0) < 0.5).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Low Confidence (&lt;50%)
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-light text-red-600">
                {documents.filter(d => (d.validation_errors?.length || 0) > 0).length}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                With Validation Errors
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}