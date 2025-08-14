'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/src/lib/supabase/client'
import { 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

interface ValidationData {
  matched_code: string | null
  matched_name: string | null
  confidence: number
  validation_status: 'exact' | 'fuzzy_high' | 'fuzzy_medium' | 'fuzzy_low' | 'no_match'
  alternative_matches: Array<{
    code: string
    name: string
    score: number
  }>
}

interface FieldValidationStatusProps {
  documentId: string
  fieldName: string
  extractedValue: any
  onAcceptMatch?: (code: string, name: string) => void
}

export function FieldValidationStatus({
  documentId,
  fieldName,
  extractedValue,
  onAcceptMatch
}: FieldValidationStatusProps) {
  const [validation, setValidation] = useState<ValidationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAlternatives, setShowAlternatives] = useState(false)

  useEffect(() => {
    fetchValidation()
  }, [documentId, fieldName])

  const fetchValidation = async () => {
    try {
      const { data, error } = await supabase
        .from('field_validations')
        .select('*')
        .eq('document_id', documentId)
        .eq('field_name', fieldName)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching validation:', error)
      }

      setValidation(data)
    } catch (error) {
      console.error('Failed to fetch validation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse h-4 bg-gray-200 rounded w-20"></div>
  }

  if (!validation || !validation.matched_code) {
    return null
  }

  const getStatusColor = () => {
    switch (validation.validation_status) {
      case 'exact':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'fuzzy_high':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'fuzzy_medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'fuzzy_low':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'no_match':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = () => {
    switch (validation.validation_status) {
      case 'exact':
      case 'fuzzy_high':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />
      case 'fuzzy_medium':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />
      case 'fuzzy_low':
        return <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
      case 'no_match':
        return <XCircleIcon className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getDisplayValue = () => {
    if (typeof extractedValue === 'object' && extractedValue !== null) {
      return extractedValue.value || extractedValue.original_value || ''
    }
    return extractedValue || ''
  }

  return (
    <div className="space-y-2">
      {/* Main validation status */}
      <div className={`p-2 rounded-lg border ${getStatusColor()}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-2">
            {getStatusIcon()}
            <div className="flex-1">
              <div className="text-sm">
                <span className="font-medium">Extracted: </span>
                <span className="text-gray-700">"{getDisplayValue()}"</span>
              </div>
              {validation.matched_code && (
                <div className="text-sm mt-1">
                  <span className="font-medium">Matched to: </span>
                  <span className="font-mono">{validation.matched_code}</span>
                  {validation.matched_name && (
                    <span className="ml-1 text-gray-600">- {validation.matched_name}</span>
                  )}
                  <span className="ml-2 text-xs text-gray-500">
                    ({Math.round(validation.confidence)}% confidence)
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {validation.validation_status !== 'exact' && onAcceptMatch && (
              <button
                onClick={() => onAcceptMatch(validation.matched_code!, validation.matched_name!)}
                className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Accept
              </button>
            )}
            {validation.alternative_matches && validation.alternative_matches.length > 0 && (
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className="p-1 text-gray-400 hover:text-gray-600"
                title="Show alternatives"
              >
                <MagnifyingGlassIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alternative matches */}
      {showAlternatives && validation.alternative_matches && (
        <div className="ml-6 p-2 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-xs font-medium text-gray-600 mb-2">Alternative matches:</div>
          <div className="space-y-1">
            {validation.alternative_matches.slice(0, 5).map((alt, index) => (
              <div 
                key={index}
                className="flex items-center justify-between text-xs p-1 hover:bg-white rounded cursor-pointer"
                onClick={() => onAcceptMatch && onAcceptMatch(alt.code, alt.name)}
              >
                <div>
                  <span className="font-mono">{alt.code}</span>
                  <span className="ml-1 text-gray-600">- {alt.name}</span>
                </div>
                <span className="text-gray-500">{alt.score}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}