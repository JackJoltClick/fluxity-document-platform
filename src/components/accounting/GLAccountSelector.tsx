'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/src/lib/utils'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export interface GLAccount {
  id: string
  gl_account: string
  description: string
  keywords: string[]
  department?: string
  priority?: number
}

export interface GLAccountSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export const GLAccountSelector: React.FC<GLAccountSelectorProps> = ({
  value,
  onChange,
  placeholder = 'Select GL account...',
  disabled = false,
  className
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch GL accounts
  useEffect(() => {
    const fetchGLAccounts = async () => {
      setLoading(true)
      try {
        const response = await fetch('/api/settings/accounting/gl-accounts')
        if (response.ok) {
          const result = await response.json()
          setGlAccounts(result.data || [])
        } else {
          console.error('Failed to fetch GL accounts:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch GL accounts:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchGLAccounts()
    }
  }, [isOpen])

  // Filter GL accounts based on search
  const filteredAccounts = glAccounts.filter(account =>
    account.gl_account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.keywords.some(keyword => 
      keyword.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleSelect = (glAccount: string) => {
    onChange(glAccount)
    setIsOpen(false)
    setSearchTerm('')
  }

  const selectedAccount = glAccounts.find(account => account.gl_account === value)

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
          <div className="flex-1 min-w-0">
            {value ? (
              <div>
                <div className="text-sm font-medium">{value}</div>
                {selectedAccount && (
                  <div className="text-xs text-gray-500 truncate">
                    {selectedAccount.description}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-sm text-gray-500">{placeholder}</span>
            )}
          </div>
          <svg
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform ml-2 flex-shrink-0',
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
                placeholder="Search GL accounts, descriptions, or keywords..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-60 overflow-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Loading GL accounts...
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchTerm ? 'No matching GL accounts found' : 'No GL accounts available'}
              </div>
            ) : (
              filteredAccounts.map((account) => (
                <button
                  key={account.id}
                  onClick={() => handleSelect(account.gl_account)}
                  className={cn(
                    'w-full px-3 py-3 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition-colors border-b border-gray-50 last:border-b-0',
                    value === account.gl_account && 'bg-blue-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={cn(
                          'text-sm font-medium',
                          value === account.gl_account ? 'text-blue-700' : 'text-gray-900'
                        )}>
                          {account.gl_account}
                        </span>
                        <span className="text-xs text-gray-500">
                          {account.description}
                        </span>
                      </div>
                      {account.keywords.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {account.keywords.slice(0, 4).map((keyword, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                            >
                              {keyword}
                            </span>
                          ))}
                          {account.keywords.length > 4 && (
                            <span className="text-xs text-gray-400">
                              +{account.keywords.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {value === account.gl_account && (
                      <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Add new option */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                // TODO: Open modal to create new GL account mapping
                console.log('Add new GL account')
              }}
              className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Add new GL account mapping
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