'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { VendorComboboxOption } from '@/src/types/vendor-matching'

interface Vendor {
  id: string
  name: string
  tax_id: string | null
  aliases?: Array<{ alias: string }>
}

interface VendorComboboxProps {
  value?: VendorComboboxOption | null
  onChange: (vendor: VendorComboboxOption | null) => void
  placeholder?: string
  disabled?: boolean
}

export default function VendorCombobox({
  value,
  onChange,
  placeholder = 'Search for a vendor...',
  disabled = false
}: VendorComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Load all vendors once
  const { data: vendors, isLoading } = useQuery({
    queryKey: ['vendors-all'],
    queryFn: async () => {
      const response = await fetch('/api/vendors')
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch vendors')
      }
      
      return result.vendors as Vendor[]
    },
    staleTime: 5 * 60 * 1000,
  })

  // Filter vendors client-side
  const filteredOptions = useMemo(() => {
    if (!vendors) return []
    
    const options: VendorComboboxOption[] = vendors.map(vendor => ({
      value: vendor.id,
      label: vendor.name,
      tax_id: vendor.tax_id,
      aliases: vendor.aliases?.map(a => a.alias) || []
    }))

    if (!searchQuery.trim()) return options.slice(0, 10)

    const query = searchQuery.toLowerCase()
    return options.filter(option => 
      option.label.toLowerCase().includes(query) ||
      option.aliases.some(alias => alias.toLowerCase().includes(query))
    )
  }, [vendors, searchQuery])

  const handleSelect = (option: VendorComboboxOption) => {
    onChange(option)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value ? value.label : searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            if (!e.target.value) onChange(null)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            <div className="py-1">
              {filteredOptions.map((option) => (
                <div key={option.value} className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                  <button onClick={() => handleSelect(option)} className="text-left w-full">
                    <div className="font-medium text-gray-900 truncate">{option.label}</div>
                    {option.tax_id && <div className="text-sm text-gray-500">Tax ID: {option.tax_id}</div>}
                    {option.aliases.length > 0 && <div className="text-sm text-gray-500">Aliases: {option.aliases.join(', ')}</div>}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-gray-500 text-center">
              {searchQuery.trim() ? 'No vendors found' : 'Start typing to search...'}
            </div>
          )}
        </div>
      )}

      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
    </div>
  )
}