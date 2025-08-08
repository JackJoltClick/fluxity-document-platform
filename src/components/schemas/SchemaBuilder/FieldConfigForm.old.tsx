'use client';

import { useState, useEffect } from 'react';
import type { SchemaField, FieldLocation, DocumentType } from '@/src/types/schema';

interface FieldConfigFormProps {
  field: Partial<SchemaField>;
  fieldNumber: number;
  totalFields: number;
  onUpdate: (updates: Partial<SchemaField>) => void;
}

export function FieldConfigForm({ field, fieldNumber, totalFields, onUpdate }: FieldConfigFormProps) {
  const [formData, setFormData] = useState({
    alternative_names: field.alternative_names?.join(', ') || '',
    data_format: field.data_format || '',
    business_purpose: field.business_purpose || '',
    examples: field.examples?.join(', ') || '',
    default_value: field.default_value || '',
    matching_list_type: field.matching_list_type || '',
    conditional_rules: field.conditional_rules ? JSON.stringify(field.conditional_rules) : '',
    vendor_rules: '',
    customer_rules: '',
    validation_rules: '',
  });

  const handleInputChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleLocationToggle = (location: FieldLocation) => {
    const locations = field.typical_locations || [];
    const newLocations = locations.includes(location)
      ? locations.filter(l => l !== location)
      : [...locations, location];
    onUpdate({ typical_locations: newLocations });
  };

  const handleDocumentTypeToggle = (docType: DocumentType) => {
    const types = field.document_types || ['invoices'];
    const newTypes = types.includes(docType)
      ? types.filter(t => t !== docType)
      : [...types, docType];
    onUpdate({ document_types: newTypes });
  };

  // Update parent on input change
  useEffect(() => {
    onUpdate({
      alternative_names: formData.alternative_names.split(',').map(s => s.trim()).filter(Boolean),
      data_format: formData.data_format,
      business_purpose: formData.business_purpose,
      examples: formData.examples.split(',').map(s => s.trim()).filter(Boolean),
      default_value: formData.default_value,
      matching_list_type: formData.matching_list_type,
    });
  }, [formData]);

  return (
    <div className="space-y-6">
      {/* Field Header */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{field.field_name}</h2>
          <span className="text-sm text-gray-500">
            Field {fieldNumber} of {totalFields}
          </span>
        </div>

        {/* Basic Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alternative Names <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.alternative_names}
              onChange={(e) => handleInputChange('alternative_names', e.target.value)}
              placeholder="e.g., Invoice ID, Inv #, Reference"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              How else might this field appear on documents?
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Format <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.data_format}
              onChange={(e) => handleInputChange('data_format', e.target.value)}
              placeholder="e.g., 10 digits, starts with 'INV-', alphanumeric"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Describe the pattern or format of this data
            </p>
          </div>
        </div>

        {/* Location and Case Sensitivity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Typical Document Location
            </label>
            <div className="space-y-2">
              {[
                { value: 'top_left', label: 'Top Left' },
                { value: 'top_right', label: 'Top Right' },
                { value: 'header', label: 'Document Header' },
                { value: 'table', label: 'In a Table' },
                { value: 'footer', label: 'Footer' },
                { value: 'near_total', label: 'Near Total Amount' },
                { value: 'other', label: 'Other' },
              ].map(({ value, label }) => (
                <label key={value} className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={field.typical_locations?.includes(value as FieldLocation) || false}
                    onChange={() => handleLocationToggle(value as FieldLocation)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Case Sensitivity
            </label>
            <select
              value={field.case_sensitive ? 'yes' : 'no'}
              onChange={(e) => onUpdate({ case_sensitive: e.target.value === 'yes' })}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="no">No - ignore case</option>
              <option value="yes">Yes - case matters</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        {/* Business Purpose and Examples */}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Business Purpose <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.business_purpose}
            onChange={(e) => handleInputChange('business_purpose', e.target.value)}
            placeholder="What is this field used for in your system? How does it fit into your workflow?"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Examples <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.examples}
            onChange={(e) => handleInputChange('examples', e.target.value)}
            placeholder="Provide 2-3 real examples of what this field looks like"
            rows={2}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Default Value and Matching List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Default Value (if missing)
            </label>
            <input
              type="text"
              value={formData.default_value}
              onChange={(e) => handleInputChange('default_value', e.target.value)}
              placeholder="e.g., USD, AUTO-GENERATED, N/A"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Existing List to Match Against
            </label>
            <select
              value={formData.matching_list_type}
              onChange={(e) => handleInputChange('matching_list_type', e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">None</option>
              <option value="gl_accounts">GL Account Codes</option>
              <option value="vendors">Vendor List</option>
              <option value="customers">Customer List</option>
              <option value="cost_centers">Cost Centers</option>
              <option value="employees">Employees</option>
              <option value="subsidiaries">Subsidiaries</option>
              <option value="custom">Custom List</option>
            </select>
          </div>
        </div>

        {/* Conditional Rules */}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Conditional Rules & Dependencies
          </label>
          <textarea
            value={formData.conditional_rules}
            onChange={(e) => handleInputChange('conditional_rules', e.target.value)}
            placeholder="Does this field behave differently based on document type, vendor, customer, or other conditions? Any dependencies on other fields?"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
          />
        </div>

        {/* Document Types */}
        <div className="mt-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Document Types Where This Field Applies:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { value: 'invoices', label: 'Invoices' },
              { value: 'purchase_orders', label: 'Purchase Orders' },
              { value: 'receipts', label: 'Receipts' },
              { value: 'statements', label: 'Statements' },
              { value: 'other', label: 'Other' },
            ].map(({ value, label }) => (
              <label key={value} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={field.document_types?.includes(value as DocumentType) || false}
                  onChange={() => handleDocumentTypeToggle(value as DocumentType)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Business Rules Section */}
      <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-cyan-500">
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 -m-6 mb-6 rounded-t-xl">
          <h2 className="text-xl font-semibold">Business Rules & Special Logic</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Vendor-Specific Rules
            </label>
            <textarea
              value={formData.vendor_rules}
              onChange={(e) => handleInputChange('vendor_rules', e.target.value)}
              placeholder="Are there special rules for specific vendors? e.g., 'For Vendor ABC, always use PO field as reference'"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Customer-Specific Rules
            </label>
            <textarea
              value={formData.customer_rules}
              onChange={(e) => handleInputChange('customer_rules', e.target.value)}
              placeholder="Any special processing rules based on your customers? e.g., 'For Customer XYZ invoices, posting date = document date + 30 days'"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Validation & Processing Rules
            </label>
            <textarea
              value={formData.validation_rules}
              onChange={(e) => handleInputChange('validation_rules', e.target.value)}
              placeholder="Any validation rules, calculations, or processing logic? e.g., 'Tax must be 10% of subtotal', 'Always appears right after field X'"
              rows={3}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}