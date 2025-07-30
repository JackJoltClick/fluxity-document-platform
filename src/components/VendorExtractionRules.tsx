'use client'

import React, { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { cn } from '@/src/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/design-system/layout/Card'
import { FormField, EnhancedInput, EnhancedTextarea } from '@/src/components/design-system/forms/FormField'
import { Button } from '@/src/components/design-system/foundations/Button'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'
import { EmptyState } from '@/src/components/design-system/feedback/EmptyState'
import { VendorExtractionRule } from '@/src/services/vendors/vendor-extraction-rules.service'

// Enhanced rule type configuration with Square-style icons and descriptions
const RULE_TYPES = {
  extraction_hint: {
    id: 'extraction_hint',
    label: 'Document Layout',
    icon: '🎯',
    color: 'blue',
    description: 'Help AI find specific data in vendor documents',
    placeholder: 'e.g., "PO numbers appear in the top-right corner of invoices"',
    examples: [
      'Invoice totals are always in bold at the bottom',
      'Line items start after the "Description" header',
      'Tax amounts are shown separately below subtotal'
    ]
  },
  cost_center_hint: {
    id: 'cost_center_hint',
    label: 'Cost Center Assignment',
    icon: '🏢',
    color: 'green',
    description: 'Automatically assign cost centers for this vendor',
    placeholder: 'e.g., "NYC office expenses go to Cost Center NYC-001"',
    examples: [
      'All invoices should go to Cost Center ADMIN',
      'Travel expenses use Cost Center TRAVEL-001',
      'IT equipment goes to Cost Center TECH'
    ]
  },
  validation_rule: {
    id: 'validation_rule',
    label: 'Data Validation',
    icon: '✓',
    color: 'purple',
    description: 'Ensure extracted data meets expected formats',
    placeholder: 'e.g., "Invoice amounts should always include tax"',
    examples: [
      'Dates must be in MM/DD/YYYY format',
      'All amounts should include sales tax',
      'Line items must have quantity and unit price'
    ]
  }
} as const

type RuleType = keyof typeof RULE_TYPES

interface VendorExtractionRulesProps {
  vendor: {
    id: string
    name: string
  } | null | undefined
  isEditing: boolean
}

export function VendorExtractionRules({ vendor, isEditing }: VendorExtractionRulesProps) {
  const [selectedRuleType, setSelectedRuleType] = useState<RuleType>('extraction_hint')
  const [instruction, setInstruction] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch existing rules
  const { data: rules = [], isLoading, refetch } = useQuery<VendorExtractionRule[]>({
    queryKey: ['vendor-extraction-rules', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return []
      const response = await fetch(`/api/vendors/${vendor.id}/extraction-rules`)
      if (!response.ok) throw new Error('Failed to fetch extraction rules')
      return response.json()
    },
    enabled: isEditing && !!vendor?.id
  })

  // Add rule mutation
  const addRuleMutation = useMutation({
    mutationFn: async () => {
      if (!vendor?.id) throw new Error('No vendor selected. Please save the vendor first.')
      if (!instruction.trim()) throw new Error('Instruction is required')

      const response = await fetch(`/api/vendors/${vendor.id}/extraction-rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_type: selectedRuleType,
          instruction: instruction.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || `Failed to add rule`)
      }
      return response.json()
    },
    onSuccess: () => {
      setInstruction('')
      setErrors({})
      refetch()
    },
    onError: (error) => {
      setErrors({ submit: error.message || 'Failed to add rule' })
    }
  })

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: string) => {
      if (!vendor?.id) throw new Error('No vendor selected')
      
      const response = await fetch(`/api/vendors/${vendor.id}/extraction-rules/${ruleId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to delete rule')
      }
      return response.json()
    },
    onSuccess: () => {
      refetch()
    }
  })

  const handleAddRule = () => {
    setErrors({})
    
    const trimmed = instruction.trim()
    if (!trimmed) {
      setErrors({ instruction: 'Instruction is required' })
      return
    }

    if (trimmed.length > 200) {
      setErrors({ instruction: 'Instruction must be 200 characters or less' })
      return
    }

    addRuleMutation.mutate()
  }

  const getRuleTypeColor = (type: string) => {
    const ruleType = RULE_TYPES[type as RuleType]
    if (!ruleType) return 'gray'
    
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200', 
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    }
    
    return colorClasses[ruleType.color] || colorClasses.blue
  }

  if (!isEditing) {
    return (
      <Card variant="ghost" className="border-dashed">
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <CardTitle level={3} className="mb-2">Save Vendor First</CardTitle>
          <CardDescription>
            Extraction rules can only be added to existing vendors. Save the vendor information above to get started.
          </CardDescription>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <CardTitle level={3} className="mb-2">
          Extraction Rules for {vendor?.name}
        </CardTitle>
        <CardDescription>
          Teach the AI how to better understand this vendor's documents with simple instructions
        </CardDescription>
      </div>

      {/* Add New Rule Section */}
      <Card variant="outlined" className="border-indigo-200 bg-indigo-50/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle level={4}>Add New Rule</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowExamples(!showExamples)}
              className="text-indigo-600 hover:text-indigo-700"
            >
              {showExamples ? 'Hide Examples' : 'Show Examples'}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {/* Rule Type Selection */}
            <FormField
              label="Rule Type"
              helpText="Choose what type of guidance you want to provide"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.values(RULE_TYPES).map((ruleType) => (
                  <button
                    key={ruleType.id}
                    type="button"
                    onClick={() => setSelectedRuleType(ruleType.id)}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all duration-200 hover:shadow-sm',
                      selectedRuleType === ruleType.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{ruleType.icon}</span>
                      <span className="font-medium text-gray-900">{ruleType.label}</span>
                    </div>
                    <p className="text-sm text-gray-500">{ruleType.description}</p>
                  </button>
                ))}
              </div>
            </FormField>

            {/* Examples (if shown) */}
            {showExamples && (
              <Card variant="ghost" className="bg-amber-50 border-amber-200">
                <CardContent className="py-4">
                  <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                    <span>💡</span>
                    Example {RULE_TYPES[selectedRuleType].label} Rules:
                  </h4>
                  <ul className="space-y-2">
                    {RULE_TYPES[selectedRuleType].examples.map((example, index) => (
                      <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                        <span className="text-amber-500 mt-1">•</span>
                        <span>"{example}"</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Instruction Input */}
            <FormField
              label="Instruction"
              helpText={`${instruction.length}/200 characters`}
              error={errors.instruction}
              required
            >
              <EnhancedTextarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={RULE_TYPES[selectedRuleType].placeholder}
                rows={3}
                maxLength={200}
                hasError={!!errors.instruction}
              />
            </FormField>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Add Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleAddRule}
                disabled={!instruction.trim() || addRuleMutation.isPending}
                loading={addRuleMutation.isPending}
                className="min-w-[120px]"
              >
                Add Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle level={4}>Active Rules ({rules.length})</CardTitle>
            {isLoading && <LoadingState size="sm" />}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {isLoading ? (
            <LoadingState message="Loading extraction rules..." />
          ) : rules.length === 0 ? (
            <EmptyState
              icon="📝"
              title="No rules configured yet"
              description="Add your first rule above to help the AI better understand this vendor's documents"
            />
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => {
                const ruleType = RULE_TYPES[rule.rule_type as RuleType]
                return (
                  <div
                    key={rule.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Rule Type Badge */}
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border',
                      getRuleTypeColor(rule.rule_type)
                    )}>
                      <span>{ruleType?.icon || '📝'}</span>
                      <span>{ruleType?.label || rule.rule_type}</span>
                    </div>

                    {/* Instruction */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-relaxed">
                        "{rule.instruction}"
                      </p>
                    </div>

                    {/* Delete Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteRuleMutation.mutate(rule.id)}
                      disabled={deleteRuleMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                    >
                      <span className="sr-only">Delete rule</span>
                      ✕
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}