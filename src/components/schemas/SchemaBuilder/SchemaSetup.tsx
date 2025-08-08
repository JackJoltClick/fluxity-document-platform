import { useState } from 'react';
import { Button } from '@/src/components/design-system/foundations/Button';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

const COMMON_FIELD_SUGGESTIONS = [
  "Invoice Number", "Invoice Date", "Due Date", "Vendor Name", "Total Amount",
  "Tax Amount", "PO Number", "Item Description", "Quantity", "Unit Price",
  "Account Code", "Cost Center", "Department", "Project Code", "Currency",
  "Payment Terms", "Discount Amount", "Shipping Cost", "Reference Number", "Notes"
];

interface SchemaSetupProps {
  name: string;
  description: string;
  fieldNames: string[];
  onUpdate: (updates: { name: string; description: string; fieldNames: string[] }) => void;
}

export function SchemaSetup({ name, description, fieldNames, onUpdate }: SchemaSetupProps) {
  const [newFieldName, setNewFieldName] = useState('');

  const updateField = (field: keyof Pick<SchemaSetupProps, 'name' | 'description'>, value: string) => {
    onUpdate({ name, description, fieldNames, [field]: value });
  };

  const addField = (fieldName: string) => {
    if (fieldName.trim() && !fieldNames.includes(fieldName.trim())) {
      onUpdate({ 
        name, 
        description, 
        fieldNames: [...fieldNames, fieldName.trim()] 
      });
      setNewFieldName('');
    }
  };

  const removeField = (index: number) => {
    const newFieldNames = fieldNames.filter((_, i) => i !== index);
    onUpdate({ name, description, fieldNames: newFieldNames });
  };

  const addSuggestedField = (fieldName: string) => {
    addField(fieldName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addField(newFieldName);
    }
  };

  const availableSuggestions = COMMON_FIELD_SUGGESTIONS.filter(
    suggestion => !fieldNames.includes(suggestion)
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Schema Configuration
        </h2>
        <p className="text-sm text-gray-600">
          Define your schema name and the fields you want to extract from documents
        </p>
      </div>

      {/* Basic Schema Info */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schema Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g., Invoice Processing Schema"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
          <p className="mt-1 text-xs text-gray-500">
            A descriptive name for this schema configuration
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe the purpose of this schema and when it should be used"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            Help others understand when to use this schema
          </p>
        </div>
      </div>

      {/* Fields Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Fields to Extract
        </h3>
        
        {/* Add Field Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter field name (e.g., Invoice Number)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField(newFieldName)}
            disabled={!newFieldName.trim() || fieldNames.includes(newFieldName.trim())}
            icon={<PlusIcon className="h-4 w-4" />}
          >
            Add Field
          </Button>
        </div>

        {/* Current Fields List */}
        {fieldNames.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Your Fields ({fieldNames.length})
            </h4>
            <div className="space-y-2">
              {fieldNames.map((fieldName, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">
                  <span className="text-sm text-gray-900">{fieldName}</span>
                  <button
                    onClick={() => removeField(index)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Common Field Suggestions */}
        {availableSuggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Common Fields (click to add)
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableSuggestions.slice(0, 10).map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => addSuggestedField(suggestion)}
                  className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
            {availableSuggestions.length > 10 && (
              <p className="text-xs text-gray-500 mt-2">
                And {availableSuggestions.length - 10} more common fields...
              </p>
            )}
          </div>
        )}
      </div>

      {/* What's Next */}
      {fieldNames.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">What happens next?</h3>
          <ul className="space-y-1 text-sm text-gray-600">
            <li>• Configure detailed settings for each of your {fieldNames.length} fields</li>
            <li>• Define business rules and validation logic</li>
            <li>• Review and activate your schema</li>
          </ul>
        </div>
      )}

      {fieldNames.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Add your first field</h3>
          <p className="text-xs text-gray-500 mb-4">
            Start by adding the fields you want to extract from your documents
          </p>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => addSuggestedField('Invoice Number')}
              icon={<PlusIcon className="h-4 w-4" />}
            >
              Add "Invoice Number"
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}