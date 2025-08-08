import { NextRequest, NextResponse } from 'next/server';
import { schemaService } from '@/src/services/schemas';
import { z } from 'zod';

const createSchemaSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  is_active: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const schemas = await schemaService.getSchemas();
    return NextResponse.json({ schemas });
  } catch (error) {
    console.error('Error fetching schemas:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schemas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSchemaSchema.parse(body);

    const schema = await schemaService.createSchema(validatedData);
    return NextResponse.json({ schema }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating schema:', error);
    return NextResponse.json(
      { error: 'Failed to create schema' },
      { status: 500 }
    );
  }
}