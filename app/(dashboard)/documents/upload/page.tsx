'use client'

import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/src/stores/auth.store'
import { supabase } from '@/src/lib/supabase/client'
import { FileUploadDropzone } from '@/src/components/design-system/forms/FileUploadDropzone'
import { PageHeader } from '@/src/components/design-system/layout/PageHeader'
import { Card } from '@/src/components/design-system/layout/Card'
import { Button } from '@/src/components/design-system/foundations/Button'
import { FormField, EnhancedTextarea } from '@/src/components/design-system/forms/FormField'
import { Alert } from '@/src/components/design-system/feedback/Alert'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']

// Custom file validation for Zod
const fileSchema = z
  .any()
  .refine((files) => {
    if (typeof window === 'undefined') return true // Skip validation during SSR
    return files?.length > 0
  }, "File is required")
  .refine((files) => {
    if (typeof window === 'undefined') return true // Skip validation during SSR
    return !files?.[0] || files[0].size <= MAX_FILE_SIZE
  }, `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`)
  .refine((files) => {
    if (typeof window === 'undefined') return true // Skip validation during SSR
    return !files?.[0] || ALLOWED_TYPES.includes(files[0].type)
  }, "Only PDF, PNG, and JPEG files are allowed")

const uploadSchema = z.object({
  file: fileSchema,
  description: z.string().optional()
})

type UploadForm = z.infer<typeof uploadSchema>

interface UploadProgress {
  isUploading: boolean
  progress: number
  message: string
}

interface UploadedFile {
  id: string
  filename: string
  size: number
  type: string
  url: string
  uploadedAt: string
}

export default function UploadPage() {
  const [dragActive, setDragActive] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    isUploading: false,
    progress: 0,
    message: ''
  })
  const [success, setSuccess] = useState<UploadedFile | null>(null)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema)
  })

  // Watch the file input to get selected file for preview
  const watchedFile = watch('file')
  const selectedFile = watchedFile?.[0] || null

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('📁 File dropped:', e.dataTransfer.files[0].name)
      setValue('file', e.dataTransfer.files)
      trigger('file') // Trigger validation
    }
  }, [setValue, trigger])

  const onSubmit = async (data: UploadForm) => {
    setUploadProgress({
      isUploading: true,
      progress: 0,
      message: 'Preparing upload...'
    })
    setSuccess(null)

    try {
      console.log('📤 Starting file upload:', selectedFile?.name)
      
      const formData = new FormData()
      formData.append('file', selectedFile!)
      if (data.description) {
        formData.append('description', data.description)
      }

      setUploadProgress(prev => ({
        ...prev,
        progress: 25,
        message: 'Uploading file...'
      }))

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include' // Include cookies for authentication
      })

      setUploadProgress(prev => ({
        ...prev,
        progress: 75,
        message: 'Processing upload...'
      }))

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setUploadProgress(prev => ({
        ...prev,
        progress: 100,
        message: 'Upload complete!'
      }))

      console.log('✅ Upload successful:', result)
      setSuccess(result.file)
      
      // Database record already created by upload API - no need to create duplicate
      
      // Invalidate documents query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      
      // Reset form after successful upload
      setTimeout(() => {
        reset()
        setUploadProgress({
          isUploading: false,
          progress: 0,
          message: ''
        })
      }, 2000)

    } catch (error) {
      console.error('❌ Upload failed:', error)
      // Note: We could add a general upload error state here if needed
      setUploadProgress({
        isUploading: false,
        progress: 0,
        message: ''
      })
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Upload Documents"
        subtitle="Upload PDF documents and images for processing. Maximum file size: 50MB."
      />

      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FileUploadDropzone
            register={register('file')}
            setValue={setValue}
            trigger={trigger}
            fieldName="file"
            selectedFile={selectedFile}
            disabled={uploadProgress.isUploading}
            error={typeof errors.file?.message === 'string' ? errors.file.message : undefined}
            maxSize={MAX_FILE_SIZE}
            allowedTypes={ALLOWED_TYPES}
            accept=".pdf,.png,.jpg,.jpeg"
            placeholder="Drag and drop a file here"
            supportedFormats="PDF, PNG, JPEG"
          />

          <FormField
            id="description"
            label="Description (Optional)"
            helpText="Add a description for this document"
          >
            <EnhancedTextarea
              {...register('description')}
              id="description"
              rows={3}
              placeholder="Add a description for this document..."
              disabled={uploadProgress.isUploading}
            />
          </FormField>

          {/* Upload Progress */}
          {uploadProgress.isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{uploadProgress.message}</span>
                <span className="text-gray-600">{uploadProgress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                ></div>
              </div>
            </div>
          )}


          {success && (
            <Alert
              variant="success"
              title="File uploaded successfully!"
            >
              <p>
                <strong>{success.filename}</strong>
              </p>
              <p className="text-xs mt-1">
                Size: {formatFileSize(success.size)} • Uploaded: {new Date(success.uploadedAt).toLocaleString()}
              </p>
            </Alert>
          )}

          <div className="flex justify-between">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/documents')}
              disabled={uploadProgress.isUploading}
            >
              Back to Documents
            </Button>
            
            <Button
              type="submit"
              disabled={uploadProgress.isUploading || Object.keys(errors).length > 0}
              loading={uploadProgress.isUploading}
            >
              {uploadProgress.isUploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="bg-gray-50 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">Supported File Types</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• PDF documents (.pdf)</li>
              <li>• PNG images (.png)</li>
              <li>• JPEG images (.jpg, .jpeg)</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">File Requirements</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Maximum file size: 50MB</li>
              <li>• Files must be readable and not corrupted</li>
              <li>• Unique filenames will be generated automatically</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}