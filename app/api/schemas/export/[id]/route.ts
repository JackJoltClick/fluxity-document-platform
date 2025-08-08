import { NextRequest, NextResponse } from 'next/server';
import { schemaService } from '@/src/services/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exportData = await schemaService.exportSchema(params.id);
    
    // Return as JSON download
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="schema-${params.id}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting schema:', error);
    return NextResponse.json(
      { error: 'Failed to export schema' },
      { status: 500 }
    );
  }
}