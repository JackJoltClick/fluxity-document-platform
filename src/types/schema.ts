export interface CustomSchema {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fields?: SchemaField[];
  business_rules?: BusinessRule[];
}

export interface SchemaField {
  id: string;
  schema_id: string;
  field_name: string;
  field_order: number;
  alternative_names: string[];
  data_format?: string;
  typical_locations: FieldLocation[];
  case_sensitive: boolean;
  business_purpose?: string;
  examples: string[];
  default_value?: string;
  matching_list_type?: MatchingListType;
  matching_list_id?: string;
  conditional_rules?: ConditionalRule[];
  document_types: DocumentType[];
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessRule {
  id: string;
  schema_id: string;
  field_id?: string;
  rule_type: 'vendor' | 'customer' | 'validation' | 'processing';
  rule_name: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConditionalRule {
  id: string;
  condition_field: string;
  condition_operator: ConditionOperator;
  condition_value: string | number | boolean;
  action_type: 'set_value' | 'transform' | 'validate';
  action_value: any;
}

export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  value: any;
  logical_operator?: 'AND' | 'OR';
}

export interface RuleAction {
  type: 'set_field' | 'transform' | 'validate' | 'reject';
  field?: string;
  value?: any;
  transform?: string;
  message?: string;
}

export type FieldLocation = 
  | 'top_left' 
  | 'top_right' 
  | 'header' 
  | 'table' 
  | 'footer' 
  | 'near_total' 
  | 'other';

export type DocumentType = 
  | 'invoices' 
  | 'purchase_orders' 
  | 'receipts' 
  | 'statements' 
  | 'other';

export type MatchingListType = 
  | 'gl_accounts' 
  | 'vendors' 
  | 'customers' 
  | 'cost_centers' 
  | 'employees' 
  | 'subsidiaries' 
  | 'custom';

export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'contains' 
  | 'not_contains' 
  | 'starts_with' 
  | 'ends_with' 
  | 'greater_than' 
  | 'less_than' 
  | 'in' 
  | 'not_in' 
  | 'regex_match';

export interface SchemaImportData {
  name: string;
  description?: string;
  fields: Omit<SchemaField, 'id' | 'schema_id' | 'created_at' | 'updated_at'>[];
  business_rules?: Omit<BusinessRule, 'id' | 'schema_id' | 'created_at' | 'updated_at'>[];
}

export interface SchemaValidationError {
  field?: string;
  rule?: string;
  message: string;
  type: 'error' | 'warning';
}

export interface SchemaBuilderState {
  currentSchema: Partial<CustomSchema>;
  fields: Partial<SchemaField>[];
  businessRules: Partial<BusinessRule>[];
  currentFieldIndex: number;
  validationErrors: SchemaValidationError[];
  isDirty: boolean;
  isLoading: boolean;
  isSaving: boolean;
}

export interface FieldConfigFormData {
  field_name: string;
  alternative_names: string;
  data_format: string;
  typical_locations: FieldLocation[];
  case_sensitive: 'no' | 'yes' | 'unknown';
  business_purpose: string;
  examples: string;
  default_value: string;
  matching_list_type?: MatchingListType;
  conditional_rules: string;
  document_types: DocumentType[];
  vendor_rules: string;
  customer_rules: string;
  validation_rules: string;
}