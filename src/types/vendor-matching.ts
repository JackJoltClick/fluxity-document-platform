export interface DocumentVendor {
  id: string
  document_id: string
  vendor_id: string
  confidence: number
  is_confirmed: boolean
  created_at: string
  updated_at: string
}

export interface VendorMatch {
  id: string
  vendor_id: string
  vendor_name: string
  vendor_tax_id: string | null
  vendor_aliases: string[]
  confidence: number
  is_confirmed: boolean
  created_at: string
}

export interface PotentialVendorMatch {
  vendor_id: string
  vendor_name: string
  vendor_tax_id: string | null
  vendor_aliases: string[]
  similarity_score: number
}

export interface VendorMatchingRequest {
  document_id: string
  vendor_id: string
  confidence: number
  is_confirmed?: boolean
}

export interface VendorMatchingResponse {
  success: boolean
  data?: DocumentVendor
  error?: string
}

export interface VendorMatchesResponse {
  success: boolean
  data?: VendorMatch[]
  error?: string
}

export interface PotentialMatchesResponse {
  success: boolean
  data?: PotentialVendorMatch[]
  error?: string
}

export interface VendorMatchingHealth {
  vendors: 'active' | 'inactive' | 'error'
  similarity: 'enabled' | 'disabled' | 'error'
  database: 'connected' | 'disconnected' | 'error'
}

export interface VendorComboboxOption {
  value: string
  label: string
  tax_id: string | null
  aliases: string[]
  similarity?: number
}

export interface VendorMatchingState {
  isSearching: boolean
  isLoading: boolean
  selectedVendor: VendorComboboxOption | null
  confirmedMatch: VendorMatch | null
  potentialMatches: PotentialVendorMatch[]
  searchResults: VendorComboboxOption[]
  error: string | null
}