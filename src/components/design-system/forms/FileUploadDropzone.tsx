import React, { useCallback, useState } from 'react'
import { UseFormRegisterReturn, UseFormSetValue, UseFormTrigger } from 'react-hook-form'
import { cn } from '@/src/lib/utils'

export interface FileUploadDropzoneProps extends React.HTMLAttributes<HTMLDivElement> {
  /** React Hook Form register return for the file input */
  register: UseFormRegisterReturn
  /** React Hook Form setValue function */
  setValue: UseFormSetValue<any>
  /** React Hook Form trigger function for validation */
  trigger: UseFormTrigger<any>
  /** Field name for the file input */
  fieldName: string
  /** Currently selected file */
  selectedFile?: File | null
  /** Maximum file size in bytes */
  maxSize?: number
  /** Allowed file types */
  allowedTypes?: string[]
  /** Accept attribute for file input */
  accept?: string
  /** Whether the upload is disabled */
  disabled?: boolean
  /** Error message to display */
  error?: string
  /** Custom placeholder text */
  placeholder?: string
  /** Additional file type descriptions */
  supportedFormats?: string
}

export const FileUploadDropzone = React.forwardRef<HTMLDivElement, FileUploadDropzoneProps>(({
  register,
  setValue,
  trigger,
  fieldName,
  selectedFile,
  maxSize = 50 * 1024 * 1024, // 50MB default
  allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'],
  accept = '.pdf,.png,.jpg,.jpeg',
  disabled = false,
  error,
  placeholder = 'Drag and drop a file here',
  supportedFormats = 'PDF, PNG, JPEG',
  className,
  ...props
}, ref) => {
  const [dragActive, setDragActive] = useState(false)

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
      setValue(fieldName, e.dataTransfer.files)
      trigger(fieldName)
    }
  }, [setValue, trigger, fieldName])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    register.onChange(e)
    trigger(fieldName)
  }

  const removeFile = () => {
    setValue(fieldName, null)
    trigger(fieldName)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn('space-y-4', className)} ref={ref} {...props}>
      {/* Drag and Drop Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
          dragActive && 'border-indigo-500 bg-indigo-50',
          selectedFile && 'border-green-500 bg-green-50',
          !dragActive && !selectedFile && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          {...register}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          disabled={disabled}
        />

        <div className="space-y-4">
          {selectedFile ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">
                  {selectedFile.type.includes('pdf') ? '📄' : '🖼️'}
                </span>
              </div>
              <p className="text-lg font-medium text-green-700">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </p>
              <button
                type="button"
                onClick={removeFile}
                className="mt-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                disabled={disabled}
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">
                {dragActive ? 'Drop file here' : placeholder}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                or click to browse files
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Supports: {supportedFormats} • Max size: {formatFileSize(maxSize)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="text-red-700">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

FileUploadDropzone.displayName = 'FileUploadDropzone'