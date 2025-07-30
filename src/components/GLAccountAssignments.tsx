'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GLAccount } from '@/src/types/gl-account.types'
import { GLRuleEvaluationResult } from '@/src/types/gl-rules.types'
import { useAuthStore } from '@/src/stores/auth.store'

interface ExtractedLineItem {
  value: string
  confidence: number
}

interface GLAssignment {
  id: string
  document_id: string
  line_item_index: number
  line_item_description: string
  gl_account_id: string
  gl_account: GLAccount
  created_at: string
  updated_at: string
}

interface GLAccountAssignmentsProps {
  documentId: string
  lineItems: ExtractedLineItem[]
  vendorName?: string
  extractedDate?: string
}

export default function GLAccountAssignments({ 
  documentId, 
  lineItems,
  vendorName,
  extractedDate
}: GLAccountAssignmentsProps) {
  const queryClient = useQueryClient()
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set())
  const [learningFeedback, setLearningFeedback] = useState<string | null>(null)
  const [ruleEvaluations, setRuleEvaluations] = useState<{ [key: number]: GLRuleEvaluationResult }>({})
  const { user } = useAuthStore()

  // Fetch all GL accounts
  const { data: glAccounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['gl-accounts-all'],
    queryFn: async () => {
      const response = await fetch('/api/gl-accounts')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch GL accounts')
      }
      
      return data.data as GLAccount[]
    }
  })

  // Fetch existing GL assignments for this document
  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['gl-assignments', documentId],
    queryFn: async () => {
      const response = await fetch(`/api/documents/${documentId}/gl-assignments`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch GL assignments')
      }
      
      return data.data as GLAssignment[]
    }
  })

  // Track GL assignment correction for learning
  const trackGLCorrection = async (lineItemDescription: string, glAccount: GLAccount, existingAssignment?: GLAssignment) => {
    // 🚀 Log function start with inputs
    console.log('🚀 trackGLCorrection: Starting GL correction tracking', {
      lineItemDescription,
      glAccount: {
        id: glAccount.id,
        code: glAccount.code,
        name: glAccount.name,
        department: glAccount.department
      },
      existingAssignment: existingAssignment ? {
        id: existingAssignment.id,
        gl_account_id: existingAssignment.gl_account_id,
        gl_account_code: existingAssignment.gl_account.code,
        gl_account_name: existingAssignment.gl_account.name
      } : null,
      documentId,
      userId: user?.id
    })

    if (!user) {
      console.log('❌ trackGLCorrection: No user found, exiting early')
      return
    }
    
    try {
      const originalValue = existingAssignment ? 
        `${existingAssignment.gl_account.code} - ${existingAssignment.gl_account.name}` : 
        'No assignment'
      
      const correctedValue = `${glAccount.code} - ${glAccount.name}`
      
      console.log('🔄 trackGLCorrection: Processing correction values', {
        originalValue,
        correctedValue,
        isActualChange: originalValue !== correctedValue
      })
      
      // Only track if this is actually a change
      if (originalValue === correctedValue) {
        console.log('⏹️ trackGLCorrection: No change detected, skipping tracking')
        return
      }
      
      const requestBody = {
        documentId,
        fieldType: 'gl_assignment',
        originalValue,
        correctedValue,
        metadata: {
          line_item_description: lineItemDescription,
          corrected_gl_account_id: glAccount.id,
          original_gl_account_id: existingAssignment?.gl_account_id
        }
      }
      
      console.log('📡 trackGLCorrection: Making API request to /api/corrections', {
        method: 'POST',
        requestBody
      })
      
      const response = await fetch('/api/corrections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 trackGLCorrection: Received response', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      const result = await response.json()
      
      console.log('📋 trackGLCorrection: Parsed response body', {
        result,
        success: result.success
      })
      
      if (result.success) {
        console.log('✅ trackGLCorrection: Successfully tracked GL correction', {
          message: 'Learning from GL assignment - future suggestions will improve!',
          correctionData: {
            originalValue,
            correctedValue,
            documentId,
            fieldType: 'gl_assignment'
          }
        })
        setLearningFeedback('✅ Learning from GL assignment - future suggestions will improve!')
        setTimeout(() => setLearningFeedback(null), 3000)
      } else {
        console.warn('⚠️ trackGLCorrection: API returned success=false', {
          result,
          requestBody
        })
      }
    } catch (error) {
      console.error('❌ trackGLCorrection: Error occurred during GL correction tracking', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        inputs: {
          lineItemDescription,
          glAccountId: glAccount.id,
          glAccountCode: glAccount.code,
          existingAssignmentId: existingAssignment?.id,
          documentId
        },
        timestamp: new Date().toISOString()
      })
      console.warn('Failed to track GL correction for learning:', error)
    }
  }

  // Create assignment mutation
  const assignMutation = useMutation({
    mutationFn: async ({ index, glAccountId, description }: { 
      index: number; 
      glAccountId: string; 
      description: string 
    }) => {
      const response = await fetch(`/api/documents/${documentId}/line-items/${index}/gl-assignment`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gl_account_id: glAccountId,
          line_item_description: description
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign GL account')
      }
      
      return data.data
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['gl-assignments', documentId] })
      
      // Track the correction for learning
      const existingAssignment = getAssignment(variables.index)
      const selectedAccount = glAccounts?.find(acc => acc.id === variables.glAccountId)
      
      if (selectedAccount) {
        await trackGLCorrection(variables.description, selectedAccount, existingAssignment)
      }
    }
  })

  // Remove assignment mutation
  const removeMutation = useMutation({
    mutationFn: async (index: number) => {
      const response = await fetch(`/api/documents/${documentId}/line-items/${index}/gl-assignment`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove GL assignment')
      }
      
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gl-assignments', documentId] })
    }
  })

  // Extract amount from line item description
  const extractAmount = (description: string): number => {
    if (!description?.trim()) return 0

    // Method 1: Standard currency formats ($123.45, USD 123.45)
    const currencyMatch = description.match(/[\$€£¥](\d{1,3}(?:,\d{3})*\.?\d{0,2})|\b(\d{1,3}(?:,\d{3})*\.?\d{0,2})\s*(?:USD|EUR|GBP|CAD|AUD)\b/i)
    if (currencyMatch) {
      const amount = parseFloat((currencyMatch[1] || currencyMatch[2]).replace(/,/g, ''))
      return amount
    }

    // Method 2: Decimal numbers with potential currency context
    const decimalMatch = description.match(/\b(\d{1,4}(?:,\d{3})*\.\d{2})\b/)
    if (decimalMatch) {
      const amount = parseFloat(decimalMatch[1].replace(/,/g, ''))
      return amount
    }

    // Method 3: Whole numbers that might be amounts
    const numberMatch = description.match(/\b(\d{1,4}(?:,\d{3})*)\b/)
    if (numberMatch) {
      const amount = parseFloat(numberMatch[1].replace(/,/g, ''))
      // Only consider as amount if reasonable range for expenses
      if (amount >= 1 && amount <= 50000) {
        return amount
      }
    }

    return 0
  }

  // Evaluate line items with GL rules engine
  useEffect(() => {
    const evaluateLineItems = async () => {
      if (!user || !lineItems?.length) return

      const evaluations: { [key: number]: GLRuleEvaluationResult } = {}
      
      for (let index = 0; index < lineItems.length; index++) {
        const item = lineItems[index]
        if (!item.value?.trim()) continue

        try {
          // Prepare line item data for rule evaluation
          const extractedAmount = extractAmount(item.value)
          const lineItemData = {
            description: item.value,
            amount: extractedAmount,
            vendor_name: vendorName,
            date: extractedDate,
            document_id: documentId,
            index
          }

          console.log(`🔍 Evaluating line item ${index}:`, {
            description: item.value,
            extractedAmount,
            vendor: vendorName
          })

          // Call the GL rules evaluation API
          const response = await fetch(`/api/gl-rules/evaluate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lineItemData)
          })
          
          if (response.ok) {
            const result = await response.json()
            if (result.success) {
              evaluations[index] = result.data
            }
          }

        } catch (error) {
          console.error('Error evaluating line item:', error)
        }
      }
      
      setRuleEvaluations(evaluations)
    }

    evaluateLineItems()
  }, [lineItems, vendorName, extractedDate, user, documentId])

  // Get GL suggestions based on line item description
  const getSuggestions = (description: string): (GLAccount & { score: number })[] => {
    if (!glAccounts || !description) return []
    
    const descLower = description.toLowerCase()
    
    return glAccounts
      .map(account => {
        let score = 0
        
        // Check keyword matches
        const keywordMatches = account.keywords.filter(keyword => 
          descLower.includes(keyword.toLowerCase())
        ).length
        
        if (keywordMatches > 0) {
          score += keywordMatches * 0.6
        }
        
        // Check name similarity
        if (descLower.includes(account.name.toLowerCase())) {
          score += 0.3
        }
        
        // Check code similarity
        if (descLower.includes(account.code.toLowerCase())) {
          score += 0.1
        }
        
        return { ...account, score }
      })
      .filter(account => account.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
  }

  // Get assignment for a specific line item
  const getAssignment = (index: number): GLAssignment | undefined => {
    return assignments?.find(a => a.line_item_index === index)
  }

  if (accountsLoading || assignmentsLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Filter out empty line items
  const validLineItems = lineItems.filter(item => item.value && item.value.trim())

  if (validLineItems.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">GL Account Assignments</h3>
        <p className="text-sm text-gray-600 mt-1">
          Assign GL accounts to line items for proper categorization
        </p>
      </div>

      <div className="divide-y divide-gray-200">
        {validLineItems.map((item, index) => {
          const assignment = getAssignment(index)
          const suggestions = getSuggestions(item.value)
          const isExpanded = expandedItems.has(index)
          
          return (
            <div key={index} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Line Item {index + 1}</h4>
                  <p className="text-sm text-gray-600 mt-1">{item.value}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                      item.confidence >= 0.8 
                        ? 'bg-green-100 text-green-800'
                        : item.confidence >= 0.6
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                    {(() => {
                      const amount = extractAmount(item.value)
                      return amount > 0 ? (
                        <span className="inline-flex text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                          ${amount.toFixed(2)} extracted
                        </span>
                      ) : null
                    })()}
                  </div>
                </div>
              </div>

              {assignment ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-green-900">
                        {assignment.gl_account.code} - {assignment.gl_account.name}
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {assignment.gl_account.department && `Department: ${assignment.gl_account.department}`}
                      </p>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(index)}
                      disabled={removeMutation.isPending}
                      className="text-red-600 hover:text-red-800 font-medium text-sm disabled:opacity-50"
                    >
                      {removeMutation.isPending ? 'Removing...' : 'Remove'}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Rule-based suggestions */}
                  {ruleEvaluations[index]?.matches && ruleEvaluations[index].matches.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Rule-Based Suggestions:
                      </p>
                      <div className="space-y-2">
                        {ruleEvaluations[index].matches.slice(0, 2).map((match) => {
                          // Find the actual GL account
                          const glAccount = glAccounts?.find(acc => acc.code === match.rule.actions.gl_code)
                          if (!glAccount) return null
                          
                          return (
                            <button
                              key={match.rule.id}
                              onClick={() => assignMutation.mutate({ 
                                index, 
                                glAccountId: glAccount.id, 
                                description: item.value 
                              })}
                              disabled={assignMutation.isPending}
                              className="w-full text-left border-2 border-blue-300 bg-blue-50 rounded-lg p-3 hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-medium text-blue-900">
                                      {glAccount.code} - {glAccount.name}
                                    </p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-200 text-blue-800">
                                      Rule Match
                                    </span>
                                    {match.should_auto_apply && (
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-200 text-green-800">
                                        Auto-Apply
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-blue-700">
                                    Rule: "{match.rule.rule_name}" • {Math.round(match.confidence * 100)}% confidence
                                  </p>
                                  <p className="text-xs text-blue-600 mt-1">
                                    Matched: {match.matched_conditions.join(', ')}
                                  </p>
                                </div>
                                <span className="text-blue-600 text-sm font-medium">
                                  {assignMutation.isPending ? 'Assigning...' : 'Apply Rule'}
                                </span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* AI/Keyword-based suggestions */}
                  {suggestions.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Keyword-Based Suggestions:
                      </p>
                      <div className="space-y-2">
                        {suggestions.map(account => (
                          <button
                            key={account.id}
                            onClick={() => assignMutation.mutate({ 
                              index, 
                              glAccountId: account.id, 
                              description: item.value 
                            })}
                            disabled={assignMutation.isPending}
                            className="w-full text-left border border-gray-200 bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors disabled:opacity-50"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {account.code} - {account.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {account.department} • {Math.round(account.score * 100)}% keyword match
                                </p>
                              </div>
                              <span className="text-gray-600 text-sm">
                                {assignMutation.isPending ? 'Assigning...' : 'Assign'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setExpandedItems(prev => {
                      const next = new Set(prev)
                      if (next.has(index)) {
                        next.delete(index)
                      } else {
                        next.add(index)
                      }
                      return next
                    })}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    {isExpanded ? 'Hide all GL accounts' : 'Show all GL accounts'}
                  </button>

                  {isExpanded && (
                    <div className="mt-3">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            assignMutation.mutate({ 
                              index, 
                              glAccountId: e.target.value, 
                              description: item.value 
                            })
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={assignMutation.isPending}
                      >
                        <option value="">Select GL Account...</option>
                        {glAccounts?.map(account => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {learningFeedback && (
        <div className="p-4 bg-green-50 border-t border-green-200">
          <div className="text-sm text-green-600">
            {learningFeedback}
          </div>
        </div>
      )}

      <div className="p-6 bg-gray-50 border-t">
        <div className="text-sm text-gray-600">
          <p className="font-medium mb-1">Assignment Summary:</p>
          <p>{assignments?.length || 0} of {validLineItems.length} line items have GL accounts assigned</p>
        </div>
      </div>
    </div>
  )
}