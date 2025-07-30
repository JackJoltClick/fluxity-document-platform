'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Vendor } from '@/src/services/vendors/vendor.service'
import { VendorExtractionRule } from '@/src/services/vendors/vendor-extraction-rules.service'
import { Button } from '@/src/components/design-system/foundations/Button'
import { VendorExtractionRules } from '@/src/components/VendorExtractionRules'

// Security validation patterns
const DANGEROUS_CONTENT_PATTERN = /ignore\s+(previous|all|above)|forget\s+(everything|all)|disregard|system\s*:|admin\s*:|execute|eval|<script|javascript:/i
const SENSITIVE_DATA_PATTERN = /\b(ssn|social\s*security|credit\s*card|password|api\s*key)\b|\b\d{3}-?\d{2}-?\d{4}\b|\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/i

const vendorSchema = z.object({
  name: z.string()
    .min(1, 'Vendor name is required')
    .max(255, 'Name too long')
    .refine(val => !/<|>|script|javascript:/i.test(val), 'Invalid characters in vendor name'),
  tax_id: z.string()
    .max(20, 'Tax ID too long')
    .regex(/^[A-Z0-9\-]*$/i, 'Tax ID can only contain letters, numbers, and hyphens')
    .optional(),
  aliases: z.array(z.object({
    alias: z.string()
      .min(1, 'Alias cannot be empty')
      .max(100, 'Alias too long')
      .refine(val => !/<|>|script|javascript:/i.test(val), 'Invalid characters in alias')
  })).optional()
})

type VendorFormData = z.infer<typeof vendorSchema>

interface VendorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  vendor?: Vendor | null
}

export function VendorModal({ isOpen, onClose, onSuccess, vendor }: VendorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState<'basic' | 'rules'>('basic')
  const isEditing = !!vendor

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      tax_id: '',
      aliases: []
    }
  })

  const { fields: aliasFields, append: appendAlias, remove: removeAlias } = useFieldArray({
    control,
    name: 'aliases'
  })

  // Reset form when vendor changes
  useEffect(() => {
    if (vendor) {
      setValue('name', vendor.name)
      setValue('tax_id', vendor.tax_id || '')
      setValue('aliases', vendor.aliases?.map(a => ({ alias: a.alias })) || [])
    } else {
      reset()
    }
  }, [vendor, setValue, reset])

  // Create/Update vendor mutation
  const vendorMutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const url = isEditing ? `/api/vendors/${vendor.id}` : '/api/vendors'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          tax_id: data.tax_id || undefined,
          aliases: data.aliases?.map(a => a.alias).filter(Boolean) || []
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save vendor')
      }

      return response.json()
    },
    onSuccess: () => {
      onSuccess()
      reset()
    },
  })

  const onSubmit = async (data: VendorFormData) => {
    setIsSubmitting(true)
    try {
      await vendorMutation.mutateAsync(data)
    } catch (error) {
      console.error('Error saving vendor:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
      reset()
    }
  }

  const addAlias = () => {
    appendAlias({ alias: '' })
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Vendor' : 'Add New Vendor'}
          </h2>
          
          {/* Tab Navigation */}
          <div className="flex space-x-4 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('basic')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'basic'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Basic Info
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'rules'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Extraction Rules
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              {/* Vendor Name */}
              <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Vendor Name *
            </label>
            <input
              {...register('name')}
              type="text"
              id="name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter vendor name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Tax ID */}
          <div>
            <label htmlFor="tax_id" className="block text-sm font-medium text-gray-700 mb-1">
              Tax ID (Optional)
            </label>
            <input
              {...register('tax_id')}
              type="text"
              id="tax_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter tax ID"
              disabled={isSubmitting}
            />
            {errors.tax_id && (
              <p className="mt-1 text-sm text-red-600">{errors.tax_id.message}</p>
            )}
          </div>

          {/* Aliases */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Aliases (Optional)
              </label>
              <Button
                type="button"
                onClick={addAlias}
                disabled={isSubmitting}
                variant="ghost"
                size="sm"
                className="text-indigo-600 hover:text-indigo-900"
              >
                + Add Alias
              </Button>
            </div>
            {aliasFields.map((field, index) => (
              <div key={field.id} className="flex items-center space-x-2 mb-2">
                <input
                  {...register(`aliases.${index}.alias`)}
                  type="text"
                  placeholder="Enter alias"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={isSubmitting}
                />
                <Button
                  type="button"
                  onClick={() => removeAlias(index)}
                  disabled={isSubmitting}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-900 !p-1"
                >
                  ✕
                </Button>
              </div>
            ))}
            {errors.aliases && (
              <p className="mt-1 text-sm text-red-600">
                {errors.aliases.message}
              </p>
            )}
              </div>
            </div>
          )}

          {/* Extraction Rules Tab - Square-style Design */}
          {activeTab === 'rules' && (
            <VendorExtractionRules 
              vendor={vendor}
              isEditing={isEditing}
            />
          )}

          {/* Error Message */}
          {vendorMutation.error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">
                {vendorMutation.error instanceof Error 
                  ? vendorMutation.error.message 
                  : 'An error occurred while saving the vendor'}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              variant="secondary"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              variant="primary"
              size="sm"
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Creating...')
                : (isEditing ? 'Update Vendor' : 'Create Vendor')
              }
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}