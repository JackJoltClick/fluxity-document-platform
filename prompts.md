# Document Processing Transformation Prompts

This document contains a series of prompts to transform the current document processing system from hardcoded accounting fields to flexible client schemas with intelligent fuzzy matching.

## Current State
- Documents have 21 hardcoded accounting columns
- Lambda returns fixed `accounting_fields` structure
- UI shows "Not mapped" for extracted data
- No export functionality
- Existing vendor rules, GL rules, and audit systems in place

## Target State
- Flexible client-defined schemas (5+ different clients)
- Dynamic column mapping via LLM contextual understanding
- Excel export with client's exact column headers
- API push capability (future)

---

## Prompt 1: Create Client Schemas Database Table

**Instructions:** Create a secure database migration that adds client schema functionality while maintaining existing system compatibility. Follow PostgreSQL best practices for UUID primary keys, proper indexing, and Row Level Security (RLS).

**Task:** Create `supabase/migrations/client_schemas_migration.sql` with:
1. `client_schemas` table with proper structure
2. Link documents to schemas (add `client_schema_id` to documents table)
3. RLS policies for user isolation
4. Indexes for performance
5. Sample schemas for 5 different client types
6. Functions for schema validation

**Security Requirements:**
- Each user can only see their own schemas
- Validate JSONB schema structure
- Prevent schema deletion if documents are using it

---

## Prompt 2: Update Lambda for Dynamic Schema Processing

**Instructions:** Modify the Lambda processor to accept and use client schemas instead of hardcoded accounting fields. Maintain existing Textract + OpenAI hybrid extraction but make the output schema dynamic.

**Current Lambda Location:** `/fluxity-lambda-processor/src/processor.ts`

**Task:** Update Lambda processor to:
1. Accept `client_schema_id` parameter in job data
2. Fetch client schema from Supabase at processing time
3. Build dynamic OpenAI prompt using client's column definitions
4. Return data in client's schema format instead of hardcoded `accounting_fields`
5. Integrate with existing vendor rules for contextual hints
6. Maintain all existing confidence scoring and cross-validation

**Key Changes:**
- Modify `processDocument()` function signature
- Update OpenAI prompt building to use dynamic schema
- Change response format to match client columns
- Add schema validation and fallback handling

---

## Prompt 3: Update Document Processing API

**Instructions:** Modify the document processing API to handle schema selection while maintaining backward compatibility with existing system. Follow NextJS API route patterns and proper error handling.

**Current API Location:** `/app/api/process-document/route.ts`

**Task:** Update the API to:
1. Accept optional `client_schema_id` in request body
2. Pass schema ID to Lambda/SQS processing
3. Validate schema exists and belongs to user
4. Maintain existing document status tracking
5. Add schema-related error handling
6. Support both old (hardcoded) and new (dynamic) processing modes

**Backward Compatibility:** Ensure existing documents without schema_id continue working with the 21-column system.

---

## Prompt 4: Create Schema Management UI

**Instructions:** Build a dashboard page for clients to create and manage their document schemas. Follow the existing UI patterns in the codebase using Tailwind CSS and the established component structure.

**Location:** Create `/app/(dashboard)/schemas/page.tsx`

**Task:** Create schema management interface with:
1. List existing schemas with edit/delete actions
2. "Create New Schema" form with dynamic column addition
3. Column name and description fields for each column
4. Schema preview with sample data
5. Set default schema functionality
6. Proper form validation and error handling
7. Integration with existing auth and user context

**UI Requirements:**
- Follow existing dashboard layout patterns
- Use established components from `/src/components/`
- Mobile-responsive design
- Loading states and error boundaries

---

## Prompt 5: Update Document Display for Dynamic Schemas

**Instructions:** Modify the document detail page to display data according to the client's schema instead of hardcoded accounting fields. Maintain existing functionality while making the display dynamic.

**Current Location:** `/app/(dashboard)/documents/[id]/page.tsx` and `/src/components/accounting/DynamicAccountingFields.tsx`

**Task:** Update document display to:
1. Fetch and display client schema columns dynamically
2. Show extracted data under client's column headers
3. Maintain confidence indicators and field editing
4. Handle documents processed with old system (graceful fallback)
5. Show schema name and column count in document header
6. Keep existing vendor matching and GL assignment functionality

**Requirements:**
- Dynamic column rendering
- Preserve all editing and confidence display features
- Clean fallback for documents without schemas

---

## Prompt 6: Build Excel Export Functionality

**Instructions:** Create an Excel export feature that generates files with client's exact column headers and extracted data. Use a robust Excel generation library and implement proper error handling.

**Task:** Create `/app/api/documents/[id]/export/route.ts` and related functionality:
1. New API endpoint for Excel export
2. Generate Excel with client's schema column headers
3. Populate with document's extracted data
4. Handle missing data gracefully
5. Include metadata sheet with processing details
6. Add export button to document detail UI
7. Proper file naming convention
8. Download progress indicators

**Technical Requirements:**
- Use `xlsx` or similar Excel library
- Proper HTTP headers for file downloads
- Error handling for malformed data
- Security validation (user owns document)

---

## Prompt 7: Add Schema Selection to Document Upload

**Instructions:** Update the document upload flow to include schema selection. Allow users to choose which schema to apply during upload, with sensible defaults.

**Current Upload Location:** Main upload interface (find existing upload components)

**Task:** Add schema selection to upload flow:
1. Schema dropdown/selector in upload UI
2. Set default schema per user
3. Pass selected schema to processing API
4. Update SQS message format to include schema ID
5. Visual indicator of which schema will be used
6. Handle upload without schema selection (use default)

**UX Requirements:**
- Don't complicate the upload flow
- Clear indication of schema selection
- Quick schema preview/info

---

## Prompt 8: Create Sample Client Schemas and Test Data

**Instructions:** Create realistic sample schemas for 5 different client types and test the system end-to-end. Include proper test documents and expected outputs.

**Task:** Create comprehensive test setup:
1. 5 distinct client schemas (accounting, legal, logistics, retail, manufacturing)
2. Sample test documents for each client type
3. Expected output mappings for each document
4. Integration tests for the complete flow
5. Performance testing with multiple schemas
6. Error condition testing (missing schemas, invalid data)

**Test Coverage:**
- Each client schema type
- Edge cases and error conditions
- Performance with multiple concurrent users
- Data validation and security boundaries

---

## Implementation Order

Execute these prompts in sequence:
1. **Database foundation** (Prompt 1)
2. **Lambda processing** (Prompt 2) 
3. **API integration** (Prompt 3)
4. **Schema management** (Prompt 4)
5. **Document display** (Prompt 5)
6. **Excel export** (Prompt 6)
7. **Upload integration** (Prompt 7)
8. **Testing and validation** (Prompt 8)

Each prompt builds on the previous ones and maintains system compatibility throughout the transformation.