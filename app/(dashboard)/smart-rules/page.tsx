'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/src/components/design-system/foundations/Button'

interface SmartRule {
  id: string
  rule_text: string
  category: 'gl_assignment' | 'cost_center' | 'extraction_hint' | 'validation'
  is_active: boolean
  created_at: string
  usage_count?: number
}

const RULE_CATEGORIES = [
  {
    id: 'gl_assignment',
    name: 'GL Assignment',
    icon: '💰',
    description: 'Automatically assign GL codes',
    examples: [
      'Amazon invoices go to GL 6200-Cloud-Services',
      'Office supplies from Staples go to GL 5200-Supplies',
      'Travel expenses over $500 go to GL 7100-Travel and require approval'
    ]
  },
  {
    id: 'cost_center',
    name: 'Cost Centers',
    icon: '🏢',
    description: 'Auto-assign cost centers',
    examples: [
      'IT equipment goes to Cost Center TECH-001',
      'Marketing expenses go to Cost Center MKT-100',
      'NYC office expenses go to Cost Center NYC-001'
    ]
  },
  {
    id: 'extraction_hint',
    name: 'Extraction Help',
    icon: '🎯',
    description: 'Help AI find data better',
    examples: [
      'Invoice totals are always in bold at the bottom right',
      'PO numbers appear in the header after "Reference:"',
      'Line items start after the "Description" column'
    ]
  },
  {
    id: 'validation',
    name: 'Data Validation',
    icon: '✓',
    description: 'Ensure data quality',
    examples: [
      'Dates must be in MM/DD/YYYY format',
      'All amounts should include tax',
      'Invoice numbers must start with "INV-"'
    ]
  }
] as const

export default function SmartRulesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('gl_assignment')
  const [ruleText, setRuleText] = useState('')
  const [showExamples, setShowExamples] = useState(false)
  const queryClient = useQueryClient()

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['smart-rules'],
    queryFn: async () => {
      const response = await fetch('/api/smart-rules')
      if (!response.ok) throw new Error('Failed to fetch smart rules')
      return response.json()
    }
  })

  const createMutation = useMutation({
    mutationFn: async (rule: { rule_text: string; category: string }) => {
      const response = await fetch('/api/smart-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create rule')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-rules'] })
      setRuleText('')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/smart-rules/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete rule')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-rules'] })
    }
  })

  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const response = await fetch(`/api/smart-rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active })
      })
      if (!response.ok) throw new Error('Failed to update rule')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smart-rules'] })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ruleText.trim()) return
    
    createMutation.mutate({
      rule_text: ruleText.trim(),
      category: selectedCategory
    })
  }

  const currentCategory = RULE_CATEGORIES.find(c => c.id === selectedCategory)
  const rulesByCategory = rules.reduce((acc: Record<string, SmartRule[]>, rule: SmartRule) => {
    if (!acc[rule.category]) acc[rule.category] = []
    acc[rule.category].push(rule)
    return acc
  }, {})

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Rules</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Write simple rules in plain English to automate GL assignments, cost centers, and improve data extraction. 
          The AI will understand and apply your rules automatically.
        </p>
      </div>

      {/* Add New Rule */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add New Rule</h2>
        
        {/* Category Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Rule Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {RULE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCategory === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium text-gray-900">{category.name}</span>
                </div>
                <p className="text-xs text-gray-500">{category.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Examples */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setShowExamples(!showExamples)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showExamples ? 'Hide Examples' : `Show ${currentCategory?.name} Examples`}
          </button>
          
          {showExamples && currentCategory && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">Example {currentCategory.name} Rules:</h4>
              <ul className="space-y-1">
                {currentCategory.examples.map((example, index) => (
                  <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                    <span className="text-amber-500">•</span>
                    <span>"{example}"</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Rule Input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rule Description
            </label>
            <textarea
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              placeholder={`e.g., ${currentCategory?.examples[0] || 'Write your rule in plain English...'}`}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">{ruleText.length}/500 characters</p>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={!ruleText.trim() || createMutation.isPending}
              loading={createMutation.isPending}
            >
              Add Rule
            </Button>
          </div>
        </form>
      </div>

      {/* Rules by Category */}
      <div className="space-y-6">
        {RULE_CATEGORIES.map((category) => {
          const categoryRules = rulesByCategory[category.id] || []
          
          return (
            <div key={category.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {category.name} Rules
                    </h3>
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-medium">
                      {categoryRules.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {categoryRules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <span className="text-4xl mb-2 block">{category.icon}</span>
                    <p>No {category.name.toLowerCase()} rules yet</p>
                    <p className="text-sm">Add your first rule above to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryRules.map((rule) => (
                      <div
                        key={rule.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          rule.is_active 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-gray-900 leading-relaxed">
                              "{rule.rule_text}"
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Created {new Date(rule.created_at).toLocaleDateString()}</span>
                              {rule.usage_count !== undefined && (
                                <span>Applied {rule.usage_count} times</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleRuleMutation.mutate({ 
                                id: rule.id, 
                                is_active: !rule.is_active 
                              })}
                              disabled={toggleRuleMutation.isPending}
                              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                rule.is_active
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Delete rule: "${rule.rule_text}"?`)) {
                                  deleteMutation.mutate(rule.id)
                                }
                              }}
                              disabled={deleteMutation.isPending}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Stats */}
      {rules.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Rule Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{rules.length}</div>
              <div className="text-sm text-gray-600">Total Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {rules.filter((r: SmartRule) => r.is_active).length}
              </div>
              <div className="text-sm text-gray-600">Active Rules</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {rules.filter((r: SmartRule) => r.category === 'gl_assignment').length}
              </div>
              <div className="text-sm text-gray-600">GL Assignment</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {rules.reduce((sum: number, r: any) => sum + (r.usage_count || 0), 0)}
              </div>
              <div className="text-sm text-gray-600">Total Applications</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}