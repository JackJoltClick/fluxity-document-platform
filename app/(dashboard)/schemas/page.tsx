'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase/client'
import { Button } from '@/src/components/design-system/foundations/Button'
import { Card } from '@/src/components/design-system/layout/Card'
import { PageHeader } from '@/src/components/design-system/layout/PageHeader'
import { LoadingState } from '@/src/components/design-system/feedback/LoadingState'
import { Alert } from '@/src/components/design-system/feedback/Alert'

interface ClientSchema {
  id: string
  name: string
  description: string | null
  columns: { name: string; description: string }[]
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

interface NewColumn {
  name: string
  description: string
  id: string
}

interface EmailAlias {
  id: string
  email_address: string
  user_id: string
  created_at: string
}

export default function SchemasPage() {
  const router = useRouter()
  const [schemas, setSchemas] = useState<ClientSchema[]>([])
  const [emailAliases, setEmailAliases] = useState<EmailAlias[]>([])
  const [loading, setLoading] = useState(true)
  const [emailLoading, setEmailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingSchema, setEditingSchema] = useState<ClientSchema | null>(null)
  const [creating, setCreating] = useState(false)
  const [newEmailAddress, setNewEmailAddress] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    columns: [] as NewColumn[]
  })

  useEffect(() => {
    fetchSchemas()
    fetchEmailAliases()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSchemas = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('client_schemas')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setSchemas(data || [])
    } catch (err) {
      console.error('Error fetching schemas:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch schemas')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailAliases = async () => {
    try {
      setEmailLoading(true)
      const { data, error } = await supabase
        .from('email_aliases')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching email aliases:', error)
        return
      }

      setEmailAliases(data || [])
    } catch (err) {
      console.error('Failed to fetch email aliases:', err)
    } finally {
      setEmailLoading(false)
    }
  }

  const addEmailAlias = async () => {
    if (!newEmailAddress.trim()) return

    try {
      setError(null)
      const { error } = await supabase
        .from('email_aliases')
        .insert([{
          email_address: newEmailAddress.trim()
        }])

      if (error) {
        throw error
      }

      setNewEmailAddress('')
      await fetchEmailAliases()
    } catch (err) {
      console.error('Error adding email alias:', err)
      setError(err instanceof Error ? err.message : 'Failed to add email alias')
    }
  }

  const deleteEmailAlias = async (alias: EmailAlias) => {
    if (!confirm(`Are you sure you want to remove "${alias.email_address}"?`)) return

    try {
      setError(null)
      const { error } = await supabase
        .from('email_aliases')
        .delete()
        .eq('id', alias.id)

      if (error) {
        throw error
      }

      await fetchEmailAliases()
    } catch (err) {
      console.error('Error deleting email alias:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete email alias')
    }
  }

  const addColumn = () => {
    setFormData(prev => ({
      ...prev,
      columns: [
        ...prev.columns,
        { name: '', description: '', id: Math.random().toString(36).substr(2, 9) }
      ]
    }))
  }

  const removeColumn = (id: string) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.filter(col => col.id !== id)
    }))
  }

  const updateColumn = (id: string, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      columns: prev.columns.map(col => 
        col.id === id ? { ...col, [field]: value } : col
      )
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Schema name is required')
      return false
    }
    if (formData.columns.length === 0) {
      setError('At least one column is required')
      return false
    }
    for (const col of formData.columns) {
      if (!col.name.trim() || !col.description.trim()) {
        setError('All column names and descriptions are required')
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setCreating(true)
      setError(null)

      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      console.log('Current user:', user)
      
      if (!user) {
        throw new Error('User not authenticated. Please log in.')
      }

      const columnsData = formData.columns.map(col => ({
        name: col.name.trim(),
        description: col.description.trim()
      }))

      if (columnsData.length === 0) {
        throw new Error('At least one column is required')
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        columns: columnsData, // Send as object, not string
        is_default: schemas.length === 0 // First schema becomes default
      }
      
      console.log('About to submit payload:', payload)

      let result
      if (editingSchema) {
        // Update existing schema
        result = await supabase
          .from('client_schemas')
          .update(payload)
          .eq('id', editingSchema.id)
          .select()
      } else {
        // Create new schema
        result = await supabase
          .from('client_schemas')
          .insert([payload])
          .select()
      }

      if (result.error) {
        console.error('Database error:', result.error)
        throw result.error
      }

      // Reset form
      setFormData({ name: '', description: '', columns: [] })
      setShowCreateForm(false)
      setEditingSchema(null)
      
      // Refresh schemas
      await fetchSchemas()
    } catch (err) {
      console.error('Error saving schema:', err)
      console.error('Full error:', JSON.stringify(err, null, 2))
      setError(err instanceof Error ? err.message : 'Failed to save schema')
    } finally {
      setCreating(false)
    }
  }

  const setAsDefault = async (schema: ClientSchema) => {
    try {
      setError(null)
      
      // First, remove default from all schemas
      await supabase
        .from('client_schemas')
        .update({ is_default: false })
        .neq('id', 'dummy') // Update all

      // Then set this one as default
      const { error } = await supabase
        .from('client_schemas')
        .update({ is_default: true })
        .eq('id', schema.id)

      if (error) {
        throw error
      }

      await fetchSchemas()
    } catch (err) {
      console.error('Error setting default schema:', err)
      setError(err instanceof Error ? err.message : 'Failed to set default schema')
    }
  }

  const deleteSchema = async (schema: ClientSchema) => {
    if (!confirm(`Are you sure you want to delete "${schema.name}"?`)) return

    try {
      setError(null)
      
      const { error } = await supabase
        .from('client_schemas')
        .update({ is_active: false })
        .eq('id', schema.id)

      if (error) {
        throw error
      }

      await fetchSchemas()
    } catch (err) {
      console.error('Error deleting schema:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete schema')
    }
  }

  const startEdit = (schema: ClientSchema) => {
    setEditingSchema(schema)
    setFormData({
      name: schema.name,
      description: schema.description || '',
      columns: schema.columns.map((col, index) => ({
        ...col,
        id: index.toString()
      }))
    })
    setShowCreateForm(true)
  }

  const cancelEdit = () => {
    setEditingSchema(null)
    setFormData({ name: '', description: '', columns: [] })
    setShowCreateForm(false)
    setError(null)
  }

  if (loading) {
    return <LoadingState message="Loading schemas..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client Schemas"
        subtitle="Manage document processing schemas for different client types"
        actions={
          !showCreateForm ? (
            <Button 
              onClick={() => setShowCreateForm(true)}
              variant="primary"
            >
              Create New Schema
            </Button>
          ) : null
        }
      />

      {error && (
        <Alert variant="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Email Configuration Section */}
      <Card className="p-6">
        <h3 className="text-lg font-medium mb-4">Email Configuration</h3>
        <p className="text-sm text-gray-600 mb-6">
          Configure email addresses that can receive documents for processing. Documents sent to these addresses will use your default schema.
        </p>
        
        <div className="space-y-4">
          {/* Add New Email */}
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="email"
                value={newEmailAddress}
                onChange={(e) => setNewEmailAddress(e.target.value)}
                placeholder="Enter email address (e.g., accounting@fluxity.ai)"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addEmailAlias()}
              />
            </div>
            <Button
              onClick={addEmailAlias}
              disabled={!newEmailAddress.trim() || emailLoading}
              variant="primary"
            >
              Add Email
            </Button>
          </div>

          {/* Email List */}
          {emailLoading ? (
            <div className="text-center py-4">
              <span className="text-sm text-gray-500">Loading email addresses...</span>
            </div>
          ) : emailAliases.length > 0 ? (
            <div className="space-y-2">
              {emailAliases.map((alias) => (
                <div key={alias.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium">{alias.email_address}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      Added {new Date(alias.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    onClick={() => deleteEmailAlias(alias)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No email addresses configured.</p>
              <p className="text-sm mt-1">Add an email address to start receiving documents.</p>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">How Email Processing Works</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Documents sent to your configured email addresses are automatically processed</li>
              <li>• They will use your <strong>default schema</strong> (marked with "Default" badge above)</li>
              <li>• If no default schema is set, documents use standard 21 accounting fields</li>
              <li>• Set up your Mailgun forwarding to route emails to these addresses</li>
            </ul>
          </div>
        </div>
      </Card>

      {showCreateForm && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">
            {editingSchema ? 'Edit Schema' : 'Create New Schema'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Schema Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Legal Services Schema"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of this schema"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium">Schema Columns</h4>
                <Button type="button" onClick={addColumn} variant="outline" size="sm">
                  Add Column
                </Button>
              </div>
              
              {formData.columns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No columns added yet. Click "Add Column" to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {formData.columns.map((column, index) => (
                    <div key={column.id} className="flex gap-3 items-start p-3 border rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <input
                            type="text"
                            value={column.name}
                            onChange={(e) => updateColumn(column.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Column name (e.g., Invoice Number)"
                            required
                          />
                        </div>
                        
                        <div>
                          <input
                            type="text"
                            value={column.description}
                            onChange={(e) => updateColumn(column.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                            placeholder="Description (e.g., Unique invoice identifier)"
                            required
                          />
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeColumn(column.id)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" onClick={cancelEdit} variant="outline">
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={creating || formData.columns.length === 0}
              >
                {creating ? 'Saving...' : editingSchema ? 'Update Schema' : 'Create Schema'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {schemas.length === 0 && !showCreateForm ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 rounded-lg w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8v4m0 0v4m-4-4h8" />
            </svg>
          </div>
          <h3 className="text-2xl font-light text-gray-900 mb-3 tracking-tight">
            No schemas created yet
          </h3>
          <p className="text-gray-500 font-light mb-8">
            Create your first client schema to start processing documents with custom field mappings.
          </p>
          <Button onClick={() => setShowCreateForm(true)} variant="primary" size="lg">
            Create New Schema
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {schemas.map((schema) => (
            <Card key={schema.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-medium">{schema.name}</h3>
                    {schema.is_default && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  
                  {schema.description && (
                    <p className="text-gray-600 mb-3">{schema.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-500 mb-3">
                    {schema.columns.length} columns • Created {new Date(schema.created_at).toLocaleDateString()}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {schema.columns.slice(0, 6).map((column, index) => (
                      <div key={index} className="text-sm bg-gray-50 px-2 py-1 rounded">
                        <span className="font-medium">{column.name}</span>
                        <span className="text-gray-500 block truncate">{column.description}</span>
                      </div>
                    ))}
                    {schema.columns.length > 6 && (
                      <div className="text-sm text-gray-500 italic">
                        +{schema.columns.length - 6} more columns...
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  {!schema.is_default && (
                    <Button
                      onClick={() => setAsDefault(schema)}
                      variant="outline"
                      size="sm"
                    >
                      Set Default
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => startEdit(schema)}
                    variant="outline"
                    size="sm"
                  >
                    Edit
                  </Button>
                  
                  <Button
                    onClick={() => deleteSchema(schema)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}