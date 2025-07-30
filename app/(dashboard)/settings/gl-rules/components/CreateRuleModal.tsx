'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, useFieldArray } from 'react-hook-form'
import { CompanyGLRule, CreateGLRuleRequest, GLRuleTestRequest } from '@/src/types/gl-rules.types'
import { Button } from '@/src/components/design-system/foundations/Button'

interface CreateRuleModalProps {
  rule?: CompanyGLRule
  onClose: () => void
  onSave: (glRule: CreateGLRuleRequest) => void
  isLoading: boolean
  error?: string
}

export function CreateRuleModal({ rule, onClose, onSave, isLoading, error }: CreateRuleModalProps) {
  const [activeTab, setActiveTab] = useState<'conditions' | 'actions' | 'test'>('conditions')
  const [testResult, setTestResult] = useState<any>(null)
  const [isTestingRule, setIsTestingRule] = useState(false)

  const { data: glAccounts } = useQuery({
    queryKey: ['gl-accounts'],
    queryFn: async () => {
      const response = await fetch('/api/gl-accounts')
      const data = await response.json()
      return data.success ? data.data : []
    }
  })

  const { data: sampleData } = useQuery({
    queryKey: ['gl-rules-test-sample'],
    queryFn: async () => {
      const response = await fetch('/api/gl-rules/test')
      const data = await response.json()
      return data.success ? data : null
    }
  })

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateGLRuleRequest>({
    defaultValues: {
      rule_name: rule?.rule_name || '',
      priority: rule?.priority || 5,
      is_active: rule?.is_active !== false,
      conditions: {
        vendor_patterns: rule?.conditions.vendor_patterns || [],
        amount_range: rule?.conditions.amount_range || { min: undefined, max: undefined },
        keywords: rule?.conditions.keywords || [],
        exact_descriptions: rule?.conditions.exact_descriptions || [],
        exclude_keywords: rule?.conditions.exclude_keywords || [],
        date_range: rule?.conditions.date_range || { start: '', end: '' },
        line_item_category: rule?.conditions.line_item_category || []
      },
      actions: {
        gl_code: rule?.actions.gl_code || '',
        auto_assign: rule?.actions.auto_assign || false,
        requires_approval: rule?.actions.requires_approval || false,
        confidence_threshold: rule?.actions.confidence_threshold || 0.8,
        override_ai: rule?.actions.override_ai || false
      }
    }
  })

  const {
    fields: vendorPatternFields,
    append: appendVendorPattern,
    remove: removeVendorPattern
  } = (useFieldArray as any)({
    control,
    name: 'conditions.vendor_patterns'
  })

  const {
    fields: keywordFields,
    append: appendKeyword,
    remove: removeKeyword
  } = (useFieldArray as any)({
    control,
    name: 'conditions.keywords'
  })

  const {
    fields: exactDescFields,
    append: appendExactDesc,
    remove: removeExactDesc
  } = (useFieldArray as any)({
    control,
    name: 'conditions.exact_descriptions'
  })

  const {
    fields: excludeKeywordFields,
    append: appendExcludeKeyword,
    remove: removeExcludeKeyword
  } = (useFieldArray as any)({
    control,
    name: 'conditions.exclude_keywords'
  })

  const watchedData = watch()

  const testRule = async (testData: any) => {
    setIsTestingRule(true)
    try {
      const testRequest: GLRuleTestRequest = {
        conditions: watchedData.conditions,
        test_data: testData
      }

      const response = await fetch('/api/gl-rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      })

      const result = await response.json()
      setTestResult(result.success ? result.result : { matched: false, explanation: 'Test failed' })
    } catch (error) {
      setTestResult({ matched: false, explanation: 'Failed to test rule' })
    } finally {
      setIsTestingRule(false)
    }
  }

  const onSubmit = (data: CreateGLRuleRequest) => {
    // Clean up empty arrays and undefined values
    const cleanedData = {
      ...data,
      conditions: {
        ...data.conditions,
        vendor_patterns: data.conditions.vendor_patterns?.filter(p => p.trim()) || [],
        keywords: data.conditions.keywords?.filter(k => k.trim()) || [],
        exact_descriptions: data.conditions.exact_descriptions?.filter(d => d.trim()) || [],
        exclude_keywords: data.conditions.exclude_keywords?.filter(k => k.trim()) || [],
        amount_range: data.conditions.amount_range?.min || data.conditions.amount_range?.max 
          ? data.conditions.amount_range 
          : undefined,
        date_range: data.conditions.date_range?.start || data.conditions.date_range?.end 
          ? data.conditions.date_range 
          : undefined
      }
    }

    onSave(cleanedData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              {rule ? 'Edit GL Rule' : 'Create GL Assignment Rule'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="flex space-x-1 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('conditions')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'conditions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Conditions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('actions')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'actions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Actions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('test')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'test'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Test Rule
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name *
              </label>
              <input
                {...register('rule_name', { required: 'Rule name is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Office Supplies - Amazon"
              />
              {errors.rule_name && (
                <p className="text-red-500 text-sm mt-1">{errors.rule_name.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                {...register('priority', { min: 1, max: 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register('is_active')}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Rule is active</span>
            </label>
          </div>

          {activeTab === 'conditions' && (
            <div className="space-y-6">
              {/* Vendor Patterns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor Patterns (30 points)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Regex patterns or exact matches for vendor names (e.g., "Amazon.*", "Office Depot")
                </p>
                {vendorPatternFields.map((field: any, index: number) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <input
                      {...register(`conditions.vendor_patterns.${index}`)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Amazon.*, Office Depot"
                    />
                    <button
                      type="button"
                      onClick={() => removeVendorPattern(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => appendVendorPattern('')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-900"
                >
                  + Add Vendor Pattern
                </Button>
              </div>

              {/* Amount Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount Range (20 points)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      {...register('conditions.amount_range.min')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Min amount"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.01"
                      {...register('conditions.amount_range.max')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Max amount"
                    />
                  </div>
                </div>
              </div>

              {/* Exact Descriptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exact Descriptions (35 points - highest scoring)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Exact matches for line item descriptions
                </p>
                {exactDescFields.map((field: any, index: number) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <input
                      {...register(`conditions.exact_descriptions.${index}`)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Adobe Creative Cloud subscription"
                    />
                    <button
                      type="button"
                      onClick={() => removeExactDesc(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => appendExactDesc('')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-900"
                >
                  + Add Exact Description
                </Button>
              </div>

              {/* Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (25 points)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Keywords that should appear in descriptions
                </p>
                {keywordFields.map((field: any, index: number) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <input
                      {...register(`conditions.keywords.${index}`)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., office, supplies, software"
                    />
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => appendKeyword('')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-900"
                >
                  + Add Keyword
                </Button>
              </div>

              {/* Exclude Keywords */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exclude Keywords
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Keywords that disqualify the rule entirely
                </p>
                {excludeKeywordFields.map((field: any, index: number) => (
                  <div key={field.id} className="flex gap-2 mb-2">
                    <input
                      {...register(`conditions.exclude_keywords.${index}`)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., repair, maintenance, return"
                    />
                    <button
                      type="button"
                      onClick={() => removeExcludeKeyword(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => appendExcludeKeyword('')}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-900"
                >
                  + Add Exclude Keyword
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GL Code *
                </label>
                <select
                  {...register('actions.gl_code', { required: 'GL code is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select GL code...</option>
                  {glAccounts?.map((account: any) => (
                    <option key={account.id} value={account.code}>
                      {account.code} - {account.name}
                    </option>
                  ))}
                </select>
                {errors.actions?.gl_code && (
                  <p className="text-red-500 text-sm mt-1">{errors.actions.gl_code.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confidence Threshold (0.1 - 1.0)
                </label>
                <input
                  type="number"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  {...register('actions.confidence_threshold')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum confidence score required to suggest this rule
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('actions.auto_assign')}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Auto-assign when confidence ≥ 80%
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('actions.requires_approval')}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Requires manual approval
                  </span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('actions.override_ai')}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Override AI suggestions
                  </span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'test' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Test Your Rule</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Test your rule against sample data to see how it performs
                </p>
              </div>

              {sampleData && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(sampleData.sample_data).map(([key, data]: [string, any]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-900 mb-2 capitalize">
                        {key.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1 mb-3">
                        <div><strong>Vendor:</strong> {data.vendor_name}</div>
                        <div><strong>Amount:</strong> ${data.amount}</div>
                        <div><strong>Description:</strong> {data.description}</div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => testRule(data)}
                        disabled={isTestingRule}
                        loading={isTestingRule}
                        variant="primary"
                        size="sm"
                        fullWidth
                      >
                        {isTestingRule ? 'Testing...' : 'Test Rule'}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {testResult && (
                <div className={`p-4 rounded-lg border ${
                  testResult.matched
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="font-medium text-sm mb-2">
                    {testResult.matched ? '✅ Rule Matched' : '❌ Rule Did Not Match'}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Score:</strong> {testResult.score}%
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    {testResult.explanation}
                  </div>
                  {testResult.matched_conditions && testResult.matched_conditions.length > 0 && (
                    <div className="text-sm text-gray-600 mt-2">
                      <strong>Matched conditions:</strong> {testResult.matched_conditions.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-6 border-t border-gray-200 mt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              loading={isLoading}
              variant="primary"
            >
              {isLoading ? 'Saving...' : 'Save Rule'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}