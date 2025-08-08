'use client';

import { useState } from 'react';
import { SchemaProgress } from './SchemaProgress';
import { SchemaSetup } from './SchemaSetup';
import { FieldConfigForm } from './FieldConfigForm';
import { BusinessRulesForm } from './BusinessRulesForm';
import { SchemaPreview } from './SchemaPreview';
// Temporary: using mock hooks for testing UI
import { useCreateSchema } from '@/src/hooks/useSchemas.mock';
import { Button } from '@/src/components/design-system/foundations/Button';
import type { SchemaBuilderState, SchemaField, BusinessRule } from '@/src/types/schema';

const COMMON_FIELD_SUGGESTIONS = [
  "Invoice Number", "Invoice Date", "Due Date", "Vendor Name", "Total Amount",
  "Tax Amount", "PO Number", "Item Description", "Quantity", "Unit Price",
  "Account Code", "Cost Center", "Department", "Project Code", "Currency",
  "Payment Terms", "Discount Amount", "Shipping Cost", "Reference Number", "Notes"
];

interface SchemaBuilderProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export function SchemaBuilder({ onComplete, onCancel }: SchemaBuilderProps) {
  const [state, setState] = useState<SchemaBuilderState>({
    currentSchema: {
      name: '',
      description: '',
    },
    fields: [], // Start with empty fields - user will add them
    businessRules: [],
    currentFieldIndex: -1, // Start at -1 for setup step
    validationErrors: [],
    isDirty: false,
    isLoading: false,
    isSaving: false,
  });

  const [fieldNames, setFieldNames] = useState<string[]>([]);

  const createSchema = useCreateSchema();
  const showSetup = state.currentFieldIndex === -1;
  const currentField = state.fields[state.currentFieldIndex];
  const isLastField = state.currentFieldIndex === state.fields.length - 1;
  const showBusinessRules = state.currentFieldIndex === state.fields.length;
  const showPreview = state.currentFieldIndex > state.fields.length;

  const handleFieldUpdate = (updates: Partial<SchemaField>) => {
    const newFields = [...state.fields];
    newFields[state.currentFieldIndex] = {
      ...newFields[state.currentFieldIndex],
      ...updates,
    };
    setState({ ...state, fields: newFields, isDirty: true });
  };

  const handleSchemaUpdate = (updates: { name: string; description: string; fieldNames: string[] }) => {
    const { fieldNames: newFieldNames, ...schemaUpdates } = updates;
    setState({ 
      ...state, 
      currentSchema: { ...state.currentSchema, ...schemaUpdates }, 
      isDirty: true 
    });
    setFieldNames(newFieldNames);
  };

  const handleBusinessRulesUpdate = (rules: Partial<BusinessRule>[]) => {
    setState({ ...state, businessRules: rules, isDirty: true });
  };

  const handleNext = () => {
    if (showPreview) {
      handleSave();
    } else if (showSetup) {
      // Generate field objects from field names when leaving setup
      const newFields = fieldNames.map((fieldName): Partial<SchemaField> => ({
        field_name: fieldName,
        alternative_names: [],
        data_format: 'text',
        typical_location: '',
        case_sensitive: false,
        business_purpose: '',
        examples: [],
        default_value: '',
        matching_list_type: 'none',
        matching_list: [],
        is_required: false,
        validation_rules: {},
        processing_rules: {},
        document_types: [],
        vendor_specific_rules: {},
        customer_specific_rules: {}
      }));
      setState({ 
        ...state, 
        fields: newFields,
        currentFieldIndex: 0 
      });
    } else {
      setState({ ...state, currentFieldIndex: state.currentFieldIndex + 1 });
    }
  };

  const handlePrevious = () => {
    setState({ ...state, currentFieldIndex: Math.max(-1, state.currentFieldIndex - 1) });
  };

  const handleSave = async () => {
    setState({ ...state, isSaving: true });
    try {
      await createSchema.mutateAsync({
        ...state.currentSchema,
        is_active: true,
      });
      
      // TODO: Save fields and business rules
      
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving schema:', error);
    } finally {
      setState({ ...state, isSaving: false });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-2xl font-semibold text-gray-900">Create Custom Schema</h1>
            <p className="mt-2 text-gray-600">
              Define field configurations to optimize document extraction accuracy
            </p>
          </div>

          {/* Progress Bar */}
          <SchemaProgress 
            currentStep={state.currentFieldIndex + 2}
            totalSteps={state.fields.length + 3}
            fieldName={showSetup ? 'Setup' : currentField?.field_name}
          />

          {/* Content */}
          <div className="p-8">
            {showSetup && (
              <SchemaSetup
                name={state.currentSchema.name || ''}
                description={state.currentSchema.description || ''}
                fieldNames={fieldNames}
                onUpdate={handleSchemaUpdate}
              />
            )}

            {!showSetup && !showBusinessRules && !showPreview && currentField && (
              <FieldConfigForm
                field={currentField}
                fieldNumber={state.currentFieldIndex + 1}
                totalFields={state.fields.length}
                onUpdate={handleFieldUpdate}
              />
            )}

            {showBusinessRules && !showPreview && (
              <BusinessRulesForm
                businessRules={state.businessRules}
                fields={state.fields}
                onUpdate={handleBusinessRulesUpdate}
              />
            )}

            {showPreview && (
              <SchemaPreview
                schema={state.currentSchema}
                fields={state.fields}
                businessRules={state.businessRules}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handlePrevious}
              disabled={state.currentFieldIndex === -1}
            >
              Previous
            </Button>

            <div className="flex gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={state.isSaving || (showSetup && (!state.currentSchema.name || fieldNames.length === 0))}
                loading={state.isSaving}
              >
                {showPreview ? 'Complete Setup' : showSetup ? 'Start Configuring Fields' : isLastField ? 'Business Rules' : 'Next Field'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}