# Custom Schema Feature Implementation Plan

## Overview
Implement a custom schema builder that allows users to define fields for document extraction, including detailed configuration options, business rules, and validation logic. Users can create schemas manually through a guided form interface or import via JSON/Excel.

## Architecture Design

### Database Schema
```sql
custom_schemas
├── id (UUID, PK)
├── user_id (UUID, FK → auth.users)
├── name (TEXT)
├── description (TEXT)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

schema_fields
├── id (UUID, PK)
├── schema_id (UUID, FK → custom_schemas)
├── field_name (TEXT)
├── field_order (INTEGER)
├── alternative_names (TEXT[])
├── data_format (TEXT)
├── typical_locations (TEXT[]) -- Multiple locations possible
├── case_sensitive (BOOLEAN)
├── business_purpose (TEXT)
├── examples (TEXT[])
├── default_value (TEXT)
├── matching_list_type (TEXT) -- 'gl_accounts', 'vendors', 'customers', etc.
├── matching_list_id (UUID) -- Reference to specific list if applicable
├── conditional_rules (JSONB)
├── document_types (TEXT[])
├── is_required (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

schema_business_rules
├── id (UUID, PK)
├── schema_id (UUID, FK → custom_schemas)
├── field_id (UUID, FK → schema_fields, nullable)
├── rule_type (TEXT) -- 'vendor', 'customer', 'validation', 'processing'
├── rule_name (TEXT)
├── conditions (JSONB)
├── actions (JSONB)
├── priority (INTEGER)
├── is_active (BOOLEAN)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

### Component Structure
```
/src/components/schemas/
├── SchemaBuilder/
│   ├── SchemaBuilder.tsx (Main container)
│   ├── SchemaProgress.tsx (Progress indicator)
│   ├── FieldConfigForm.tsx (Field configuration form)
│   ├── BusinessRulesForm.tsx (Business rules section)
│   ├── SchemaImport.tsx (JSON/Excel import)
│   └── SchemaPreview.tsx (Review before save)
├── SchemaManagement/
│   ├── SchemaList.tsx (List all schemas)
│   ├── SchemaCard.tsx (Individual schema card)
│   └── SchemaActions.tsx (Edit/Delete/Clone actions)
└── hooks/
    ├── useSchemas.ts
    └── useSchemaFields.ts
```

### API Routes
```
/api/schemas/
├── GET    - List user's schemas
├── POST   - Create new schema
├── /:id
│   ├── GET    - Get schema details with fields
│   ├── PUT    - Update schema
│   └── DELETE - Delete schema
├── /:id/fields
│   ├── GET    - Get all fields for schema
│   ├── POST   - Add field to schema
│   └── /:fieldId
│       ├── PUT    - Update field
│       └── DELETE - Delete field
├── /:id/rules
│   ├── GET    - Get business rules
│   ├── POST   - Add rule
│   └── /:ruleId
│       ├── PUT    - Update rule
│       └── DELETE - Delete rule
├── /import
│   ├── POST   - Import schema from JSON/Excel
└── /export/:id
    └── GET    - Export schema as JSON
```

## Implementation Steps

### Phase 1: Database & Backend (Week 1)
1. Create database migration with tables and RLS policies
2. Implement TypeScript types for schemas
3. Create Supabase service functions
4. Build API routes with validation
5. Add import/export utilities

### Phase 2: UI Components (Week 2)
1. Build SchemaBuilder component with stepper interface
2. Create FieldConfigForm with all field options
3. Implement BusinessRulesForm with conditional logic builder
4. Add real-time validation and preview
5. Style with existing Tailwind design system

### Phase 3: Management Interface (Week 3)
1. Create schema list page in dashboard
2. Build schema cards with quick actions
3. Add edit/clone functionality
4. Implement schema activation/deactivation
5. Add usage statistics

### Phase 4: Integration (Week 4)
1. Update document processing to use custom schemas
2. Add schema selection during document upload
3. Modify extraction services to apply schema rules
4. Update field mapping to use schema definitions
5. Add learning from corrections back to schema

## Key Features

### Field Configuration
- **Basic Info**: Field name, alternative names, data format
- **Location Hints**: Multiple typical locations on documents
- **Business Context**: Purpose, examples, default values
- **Matching Lists**: Link to existing vendor/GL/customer lists
- **Conditional Rules**: If-then logic based on other fields
- **Document Types**: Apply to specific document types only

### Business Rules Engine
- **Vendor/Customer Rules**: Specific processing per entity
- **Validation Rules**: Data format, range, required fields
- **Processing Rules**: Calculations, transformations
- **Priority System**: Order of rule application

### Import/Export
- **JSON Format**: Full schema definition
- **Excel Template**: User-friendly format with validation
- **Validation**: Check for conflicts and missing data
- **Merge Options**: Update existing or create new

### User Experience
- **Guided Setup**: Step-by-step field configuration
- **Progress Tracking**: Visual progress through fields
- **Inline Help**: Contextual help and examples
- **Preview Mode**: See how schema will work
- **Template Library**: Pre-built schemas for common uses

## Technical Considerations

### State Management
```typescript
interface SchemaBuilderState {
  currentSchema: CustomSchema;
  fields: SchemaField[];
  businessRules: BusinessRule[];
  currentFieldIndex: number;
  validationErrors: ValidationError[];
  isDirty: boolean;
}
```

### Validation Rules
- Field names must be unique within schema
- At least one field required
- Conditional rules must reference existing fields
- Import validation against schema structure

### Performance
- Lazy load fields for large schemas
- Debounce auto-save during editing
- Cache schema definitions
- Optimize rule evaluation

### Security
- RLS policies for multi-tenant isolation
- Validate all conditional rules server-side
- Sanitize regex patterns
- Audit trail for schema changes

## UI/UX Guidelines

### Design Principles
1. **Progressive Disclosure**: Show advanced options only when needed
2. **Contextual Help**: Inline examples and tooltips
3. **Visual Feedback**: Clear validation states
4. **Consistency**: Match existing Fluxity design system

### Color Scheme
- Primary: #667eea (Purple gradient)
- Secondary: #764ba2
- Success: #10b981
- Warning: #f59e0b
- Error: #ef4444
- Background: #f8f9fa

### Component Library
- Use existing Button, Input, Select components
- Extend Card component for schema display
- Create custom Stepper component
- Reuse existing form validation patterns

## Testing Strategy

### Unit Tests
- Schema validation logic
- Business rule evaluation
- Import/export transformations

### Integration Tests
- API route functionality
- Database operations
- Schema application in extraction

### E2E Tests
- Complete schema creation flow
- Import/export functionality
- Schema editing and deletion

## Deployment Plan

1. **Migration**: Run database migration
2. **Feature Flag**: Deploy behind feature flag
3. **Beta Testing**: Select users for feedback
4. **Documentation**: User guide and API docs
5. **Training**: Create video tutorials
6. **Launch**: Gradual rollout to all users

## Success Metrics

- Schema creation rate
- Fields per schema average
- Import vs manual creation ratio
- Extraction accuracy improvement
- User satisfaction scores
- Time to create schema

## Future Enhancements

1. **AI-Assisted Setup**: Suggest fields based on document samples
2. **Schema Marketplace**: Share schemas between users
3. **Version Control**: Track schema changes over time
4. **A/B Testing**: Compare schema effectiveness
5. **Smart Defaults**: Learn from usage patterns