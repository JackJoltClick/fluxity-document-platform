import type { CustomSchema, SchemaField, BusinessRule } from '@/src/types/schema';

interface SchemaPreviewProps {
  schema: Partial<CustomSchema>;
  fields: Partial<SchemaField>[];
  businessRules: Partial<BusinessRule>[];
}

export function SchemaPreview({ schema, fields, businessRules }: SchemaPreviewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Review Your Schema Configuration
        </h2>

        {/* Schema Info */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Schema Information</h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-600">Name:</span>
              <p className="text-gray-900 mt-1">{schema.name || 'Unnamed Schema'}</p>
            </div>
            {schema.description && (
              <div>
                <span className="text-sm font-medium text-gray-600">Description:</span>
                <p className="text-gray-700 mt-1">{schema.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Fields Summary */}
        <div className="border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Configured Fields ({fields.length})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {fields.map((field, index) => (
              <div key={index} className="border-l-2 border-gray-300 pl-4 py-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{field.field_name}</h4>
                    {field.alternative_names && field.alternative_names.length > 0 && (
                      <p className="text-sm text-gray-600 mt-1">
                        Alt names: {field.alternative_names.join(', ')}
                      </p>
                    )}
                    {field.business_purpose && (
                      <p className="text-sm text-gray-600 mt-1">{field.business_purpose}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    {field.is_required && (
                      <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        Required
                      </span>
                    )}
                    {field.matching_list_type && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded ml-2">
                        {field.matching_list_type}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Business Rules Summary */}
        {businessRules.length > 0 && (
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Business Rules ({businessRules.length})
            </h3>
            <div className="space-y-3">
              {businessRules.map((rule, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200">
                  <div>
                    <span className="font-medium text-gray-800">{rule.rule_name || `Rule ${index + 1}`}</span>
                    <span className="ml-2 text-sm text-gray-600">({rule.rule_type})</span>
                  </div>
                  {rule.is_active === false && (
                    <span className="text-sm text-gray-500">Inactive</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{fields.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Fields</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">
              {fields.filter(f => f.is_required).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Required Fields</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
            <div className="text-3xl font-bold text-gray-900">{businessRules.length}</div>
            <div className="text-sm text-gray-600 mt-1">Business Rules</div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> After saving, you can always edit this schema configuration 
          or create additional schemas for different document types.
        </p>
      </div>
    </div>
  );
}