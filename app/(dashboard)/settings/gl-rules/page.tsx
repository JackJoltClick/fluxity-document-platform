'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CompanyGLRule, CreateGLRuleRequest, UpdateGLRuleRequest } from '@/src/types/gl-rules.types'
import { CreateRuleModal } from './components/CreateRuleModal'
import { Button } from '@/src/components/design-system/foundations/Button'

export default function GLRulesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<CompanyGLRule | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const queryClient = useQueryClient()

  const { data: glRules, isLoading, error } = useQuery({
    queryKey: ['gl-rules', { include_stats: true }],
    queryFn: async () => {
      const response = await fetch('/api/gl-rules?include_stats=true')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch GL rules')
      }
      
      return data.data
    }
  })

  const createMutation = useMutation({
    mutationFn: async (glRule: CreateGLRuleRequest) => {
      const response = await fetch('/api/gl-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(glRule)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create GL rule')
      }
      
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-rules'] })
      setIsCreateModalOpen(false)
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (updates: UpdateGLRuleRequest) => {
      const response = await fetch('/api/gl-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update GL rule')
      }
      
      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-rules'] })
      setEditingRule(null)
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/gl-rules?id=${id}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete GL rule')
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-rules'] })
    }
  })

  const toggleRuleStatus = (rule: CompanyGLRule) => {
    updateMutation.mutate({
      id: rule.id,
      is_active: !rule.is_active
    })
  }

  const formatConditionsSummary = (rule: CompanyGLRule) => {
    const conditions = []
    
    if (rule.conditions.vendor_patterns?.length) {
      conditions.push(`Vendor: ${rule.conditions.vendor_patterns.join(', ')}`)
    }
    if (rule.conditions.exact_descriptions?.length) {
      conditions.push(`Exact: "${rule.conditions.exact_descriptions[0]}"${rule.conditions.exact_descriptions.length > 1 ? ` (+${rule.conditions.exact_descriptions.length - 1})` : ''}`)
    }
    if (rule.conditions.keywords?.length) {
      conditions.push(`Keywords: ${rule.conditions.keywords.join(', ')}`)
    }
    if (rule.conditions.amount_range) {
      const { min, max } = rule.conditions.amount_range
      if (min !== undefined && max !== undefined) {
        conditions.push(`Amount: $${min}-$${max}`)
      } else if (min !== undefined) {
        conditions.push(`Amount: >$${min}`)
      } else if (max !== undefined) {
        conditions.push(`Amount: <$${max}`)
      }
    }
    if (rule.conditions.exclude_keywords?.length) {
      conditions.push(`Exclude: ${rule.conditions.exclude_keywords.join(', ')}`)
    }
    
    return conditions.join(' • ') || 'No conditions'
  }

  const filteredRules = glRules?.filter((rule: CompanyGLRule) =>
    rule.rule_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rule.actions.gl_code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">GL Assignment Rules</h1>
          <p className="text-gray-600">Create automated rules to assign GL codes based on vendor, description, and amount patterns</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          variant="primary"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          }
        >
          Create Rule
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <input
          type="text"
          placeholder="Search rules by name or GL code..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Stats Summary */}
      {glRules && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{glRules.length}</div>
            <div className="text-sm text-gray-600">Total Rules</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">
              {glRules.filter((r: CompanyGLRule) => r.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Rules</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {glRules.filter((r: CompanyGLRule) => r.actions.auto_assign).length}
            </div>
            <div className="text-sm text-gray-600">Auto-Apply Rules</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-orange-600">
              {glRules.reduce((sum: number, r: any) => sum + (r.stats?.total_applications || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
        </div>
      )}

      {/* Rules List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading GL rules...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">
            Error loading GL rules: {error.message}
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No rules match your search' : 'No GL rules created yet. Create your first rule to get started!'}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredRules.map((rule: any) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {rule.rule_name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Priority: {rule.priority}
                        </span>
                        {rule.actions.auto_assign && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Auto-Apply
                          </span>
                        )}
                        {rule.actions.requires_approval && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Needs Approval
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <div className="text-sm text-gray-600 mb-1">Conditions:</div>
                      <div className="text-sm text-gray-900">{formatConditionsSummary(rule)}</div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">GL Code:</span>{' '}
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">{rule.actions.gl_code}</span>
                      </div>
                      {rule.stats && (
                        <div className="text-gray-500">
                          Applied {rule.stats.total_applications} times 
                          {rule.stats.override_rate > 0 && (
                            <span className="text-orange-600"> • {rule.stats.override_rate}% override rate</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={() => toggleRuleStatus(rule)}
                      variant={rule.is_active ? "secondary" : "success"}
                      size="sm"
                      disabled={updateMutation.isPending}
                    >
                      {rule.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      onClick={() => setEditingRule(rule)}
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the rule "${rule.rule_name}"?`)) {
                          deleteMutation.mutate(rule.id)
                        }
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-900"
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateRuleModal
          onClose={() => setIsCreateModalOpen(false)}
          onSave={(glRule) => createMutation.mutate(glRule)}
          isLoading={createMutation.isPending}
          error={createMutation.error?.message}
        />
      )}

      {/* Edit Modal */}
      {editingRule && (
        <CreateRuleModal
          rule={editingRule}
          onClose={() => setEditingRule(null)}
          onSave={(updates) => updateMutation.mutate({ id: editingRule.id, ...updates })}
          isLoading={updateMutation.isPending}
          error={updateMutation.error?.message}
        />
      )}
    </div>
  )
}