'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/src/lib/utils'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export interface CompanyMapping {
  id: string
  user_id: string
  supplier_name: string
  company_code: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompanyCodeSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const CompanyCodeSelector: React.FC<CompanyCodeSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select company code...',
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [mappings, setMappings] = useState<CompanyMapping[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch company mappings
  useEffect(() => {
    const fetchMappings = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/settings/accounting/company-mappings')
        if (response.ok) {
          const result = await response.json()
          setMappings(result.data || [])
        } else {
          console.error('Failed to fetch company mappings:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch company mappings:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchMappings()
    }
  }, [isOpen])

  // Get unique company codes
  const uniqueCompanyCodes = Array.from(
    new Set(mappings.map(m => m.company_code))
  ).sort()

  // Filter codes based on search
  const filteredCodes = uniqueCompanyCodes.filter(code =>
    code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (code: string) => {
    onChange(code)
    setIsOpen(false)
    setSearchTerm('')
  }

  const selectedMapping = mappings.find(m => m.company_code === value)

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500',
          disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
          'hover:bg-gray-50 transition-colors'
        )}
      >
        <div className="flex items-center justify-between">
          <span className={cn(
            'block truncate text-sm',
            !value && 'text-gray-500'
          )}>
            {value || placeholder}
          </span>
          <svg
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              isOpen && 'transform rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search company codes..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Loading company codes...
              </div>
            ) : filteredCodes.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No matching company codes found' : 'No company codes available'}
              </div>
            ) : (
              filteredCodes.map((code) => {
                const relatedMappings = mappings.filter(m => m.company_code === code)
                return (
                  <button
                    key={code}
                    onClick={() => handleSelect(code)}
                    className={cn(
                      'w-full px-3 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors',
                      value === code && 'bg-blue-50 text-blue-700'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">{code}</div>
                        {relatedMappings.length > 0 && (
                          <div className="text-xs text-gray-500">
                            Used by {relatedMappings.length} supplier{relatedMappings.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      {value === code && (
                        <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Add new option */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                // TODO: Open modal to create new company mapping
                console.log('Add new company code')
              }}
              className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add new company code
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}