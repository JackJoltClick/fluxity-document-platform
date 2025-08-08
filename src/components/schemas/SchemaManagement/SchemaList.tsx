import { SchemaCard } from './SchemaCard';
import type { CustomSchema } from '@/src/types/schema';

interface SchemaListProps {
  schemas: CustomSchema[];
}

export function SchemaList({ schemas }: SchemaListProps) {
  if (schemas.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No schemas</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new schema.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {schemas.map((schema) => (
        <SchemaCard key={schema.id} schema={schema} />
      ))}
    </div>
  );
}