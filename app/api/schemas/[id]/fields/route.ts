import { NextRequest, NextResponse } from 'next/server';
import { schemaService } from '@/src/services/schemas';
import { z } from 'zod';

const createFieldSchema = z.object({
  field_name: z.string().min(1).max(255),
  field_order: z.number().int().positive(),
  alternative_names: z.array(z.string()).optional().default([]),
  data_format: z.string().optional(),
  typical_locations: z.array(z.enum(['top_left', 'top_right', 'header', 'table', 'footer', 'near_total', 'other'])).optional().default([]),
  case_sensitive: z.boolean().optional().default(false),
  business_purpose: z.string().optional(),
  examples: z.array(z.string()).optional().default([]),
  default_value: z.string().optional(),
  matching_list_type: z.enum(['gl_accounts', 'vendors', 'customers', 'cost_centers', 'employees', 'subsidiaries', 'custom']).optional(),
  matching_list_id: z.string().uuid().optional(),
  conditional_rules: z.array(z.any()).optional().default([]),
  document_types: z.array(z.enum(['invoices', 'purchase_orders', 'receipts', 'statements', 'other'])).optional().default(['invoices']),
  is_required: z.boolean().optional().default(false),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fields = await schemaService.getSchemaFields(params.id);
    return NextResponse.json({ fields });
  } catch (error) {
    console.error('Error fetching schema fields:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schema fields' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = createFieldSchema.parse(body);

    const field = await schemaService.createField({
      ...validatedData,
      schema_id: params.id,
    });

    return NextResponse.json({ field }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating field:', error);
    return NextResponse.json(
      { error: 'Failed to create field' },
      { status: 500 }
    );
  }
}