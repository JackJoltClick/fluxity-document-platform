import { NextRequest, NextResponse } from 'next/server';
import { schemaService } from '@/src/services/schemas';
import { z } from 'zod';

const updateSchemaSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schema = await schemaService.getSchemaById(params.id);
    return NextResponse.json({ schema });
  } catch (error) {
    console.error('Error fetching schema:', error);
    return NextResponse.json(
      { error: 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = updateSchemaSchema.parse(body);

    const schema = await schemaService.updateSchema(params.id, validatedData);
    return NextResponse.json({ schema });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error updating schema:', error);
    return NextResponse.json(
      { error: 'Failed to update schema' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await schemaService.deleteSchema(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting schema:', error);
    return NextResponse.json(
      { error: 'Failed to delete schema' },
      { status: 500 }
    );
  }
}