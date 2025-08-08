import { NextRequest, NextResponse } from 'next/server';
import { schemaService } from '@/src/services/schemas';
import { z } from 'zod';
// Note: Install xlsx package: npm install xlsx
// import * as XLSX from 'xlsx';

const importSchemaSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  fields: z.array(z.object({
    field_name: z.string(),
    field_order: z.number(),
    alternative_names: z.array(z.string()).optional(),
    data_format: z.string().optional(),
    typical_locations: z.array(z.string()).optional(),
    case_sensitive: z.boolean().optional(),
    business_purpose: z.string().optional(),
    examples: z.array(z.string()).optional(),
    default_value: z.string().optional(),
    matching_list_type: z.string().optional(),
    conditional_rules: z.array(z.any()).optional(),
    document_types: z.array(z.string()).optional(),
    is_required: z.boolean().optional(),
  })),
  business_rules: z.array(z.object({
    field_id: z.string().uuid().optional(),
    rule_type: z.enum(['vendor', 'customer', 'validation', 'processing']),
    rule_name: z.string(),
    conditions: z.array(z.any()).optional(),
    actions: z.array(z.any()).optional(),
    priority: z.number().optional(),
    is_active: z.boolean().optional(),
  })).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');

    let importData;

    if (contentType?.includes('application/json')) {
      // Handle JSON import
      const body = await request.json();
      importData = importSchemaSchema.parse(body);
    } else if (contentType?.includes('multipart/form-data')) {
      // Handle Excel import - uncomment when xlsx is installed
      return NextResponse.json(
        { error: 'Excel import not yet implemented. Please install xlsx package first.' },
        { status: 501 }
      );
      
      // const formData = await request.formData();
      // const file = formData.get('file') as File;
      
      // if (!file) {
      //   return NextResponse.json(
      //     { error: 'No file provided' },
      //     { status: 400 }
      //   );
      // }

      // const buffer = await file.arrayBuffer();
      // const workbook = XLSX.read(buffer, { type: 'array' });
      
      // // Parse Excel to schema format
      // importData = parseExcelToSchema(workbook);
      
      // // Validate parsed data
      // importData = importSchemaSchema.parse(importData);
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    const schema = await schemaService.importSchema(importData);
    return NextResponse.json({ schema }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid import data', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error importing schema:', error);
    return NextResponse.json(
      { error: 'Failed to import schema' },
      { status: 500 }
    );
  }
}

// Uncomment when xlsx is installed
/*
function parseExcelToSchema(workbook: XLSX.WorkBook) {
  const schemaSheet = workbook.Sheets['Schema'];
  const fieldsSheet = workbook.Sheets['Fields'];
  const rulesSheet = workbook.Sheets['Business Rules'];

  if (!schemaSheet || !fieldsSheet) {
    throw new Error('Excel file must contain "Schema" and "Fields" sheets');
  }

  // Parse schema info
  const schemaData = XLSX.utils.sheet_to_json(schemaSheet)[0] as any;
  
  // Parse fields
  const fieldsData = XLSX.utils.sheet_to_json(fieldsSheet);
  const fields = fieldsData.map((row: any, index: number) => ({
    field_name: row['Field Name'],
    field_order: index + 1,
    alternative_names: row['Alternative Names']?.split(',').map((s: string) => s.trim()) || [],
    data_format: row['Data Format'] || undefined,
    typical_locations: row['Typical Locations']?.split(',').map((s: string) => s.trim()) || [],
    case_sensitive: row['Case Sensitive'] === 'Yes',
    business_purpose: row['Business Purpose'] || undefined,
    examples: row['Examples']?.split(',').map((s: string) => s.trim()) || [],
    default_value: row['Default Value'] || undefined,
    matching_list_type: row['Matching List Type'] || undefined,
    document_types: row['Document Types']?.split(',').map((s: string) => s.trim()) || ['invoices'],
    is_required: row['Required'] === 'Yes',
  }));

  // Parse business rules if sheet exists
  let business_rules = [];
  if (rulesSheet) {
    const rulesData = XLSX.utils.sheet_to_json(rulesSheet);
    business_rules = rulesData.map((row: any) => ({
      rule_type: row['Rule Type'],
      rule_name: row['Rule Name'],
      conditions: JSON.parse(row['Conditions'] || '[]'),
      actions: JSON.parse(row['Actions'] || '[]'),
      priority: parseInt(row['Priority']) || 0,
      is_active: row['Active'] !== 'No',
    }));
  }

  return {
    name: schemaData['Schema Name'],
    description: schemaData['Description'] || undefined,
    fields,
    business_rules,
  };
}
*/