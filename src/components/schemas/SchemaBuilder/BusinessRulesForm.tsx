'use client';

import { useState } from 'react';
import type { BusinessRule, SchemaField } from '@/src/types/schema';

interface BusinessRulesFormProps {
  businessRules: Partial<BusinessRule>[];
  fields: Partial<SchemaField>[];
  onUpdate: (rules: Partial<BusinessRule>[]) => void;
}

export function BusinessRulesForm({ businessRules, fields, onUpdate }: BusinessRulesFormProps) {
  const [rules, setRules] = useState<Partial<BusinessRule>[]>(businessRules);

  const addRule = () => {
    const newRule: Partial<BusinessRule> = {
      rule_type: 'validation',
      rule_name: '',
      conditions: [],
      actions: [],
      priority: rules.length,
      is_active: true,
    };
    const updatedRules = [...rules, newRule];
    setRules(updatedRules);
    onUpdate(updatedRules);
  };

  const updateRule = (index: number, updates: Partial<BusinessRule>) => {
    const updatedRules = [...rules];
    updatedRules[index] = { ...updatedRules[index], ...updates };
    setRules(updatedRules);
    onUpdate(updatedRules);
  };

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    setRules(updatedRules);
    onUpdate(updatedRules);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Global Business Rules
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Define rules that apply across all fields and documents
        </p>

        {rules.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-500 mb-4">No business rules defined yet</p>
            <button
              onClick={addRule}
              className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              Add First Rule
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule, index) => (
              <div key={index} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-800">
                    Rule {index + 1}
                  </h3>
                  <button
                    onClick={() => removeRule(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Name
                    </label>
                    <input
                      type="text"
                      value={rule.rule_name || ''}
                      onChange={(e) => updateRule(index, { rule_name: e.target.value })}
                      placeholder="e.g., Validate Invoice Total"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rule Type
                    </label>
                    <select
                      value={rule.rule_type || 'validation'}
                      onChange={(e) => updateRule(index, { 
                        rule_type: e.target.value as BusinessRule['rule_type'] 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                    >
                      <option value="validation">Validation</option>
                      <option value="processing">Processing</option>
                      <option value="vendor">Vendor-Specific</option>
                      <option value="customer">Customer-Specific</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rule Description
                  </label>
                  <textarea
                    placeholder="Describe what this rule does..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none"
                  />
                </div>

                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={rule.is_active !== false}
                      onChange={(e) => updateRule(index, { is_active: e.target.checked })}
                      className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                    />
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
            ))}

            <button
              onClick={addRule}
              className="w-full py-3 border border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              + Add Another Rule
            </button>
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Common Rule Examples
        </h3>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-start space-x-2">
            <span className="text-gray-900">•</span>
            <p>
              <strong>Vendor Matching:</strong> If vendor name contains "ABC Corp", 
              then set GL account to "5000-Supplies"
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-gray-900">•</span>
            <p>
              <strong>Date Validation:</strong> Invoice date must not be more than 
              90 days in the past
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-gray-900">•</span>
            <p>
              <strong>Amount Validation:</strong> If total amount exceeds $10,000, 
              flag for manual review
            </p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="text-gray-900">•</span>
            <p>
              <strong>Customer Rules:</strong> For customer XYZ, payment terms are 
              always NET 45
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}