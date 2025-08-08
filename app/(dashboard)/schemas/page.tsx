'use client';

import { useState } from 'react';
// Temporary: using mock hooks for testing UI
import { useSchemas } from '@/src/hooks/useSchemas.mock';
import { SchemaList } from '@/src/components/schemas/SchemaManagement/SchemaList';
import { SchemaBuilder } from '@/src/components/schemas/SchemaBuilder/SchemaBuilder';
import { SchemaImport } from '@/src/components/schemas/SchemaBuilder/SchemaImport';
import { Button } from '@/src/components/design-system/foundations/Button';
import { PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

export default function SchemasPage() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const { data: schemas, isLoading } = useSchemas();

  const handleCreateComplete = () => {
    setShowBuilder(false);
  };

  const handleImportComplete = () => {
    setShowImport(false);
  };

  if (showBuilder) {
    return (
      <SchemaBuilder 
        onComplete={handleCreateComplete}
        onCancel={() => setShowBuilder(false)}
      />
    );
  }

  if (showImport) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto">
          <SchemaImport
            onSuccess={handleImportComplete}
            onCancel={() => setShowImport(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Custom Schemas</h1>
            <p className="mt-2 text-gray-600">
              Define custom field schemas for document extraction
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              icon={<ArrowUpTrayIcon className="h-5 w-5" />}
              onClick={() => setShowImport(true)}
            >
              Import Schema
            </Button>
            <Button
              variant="primary"
              icon={<PlusIcon className="h-5 w-5" />}
              onClick={() => setShowBuilder(true)}
            >
              Create Schema
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <SchemaList schemas={schemas || []} />
      )}
    </div>
  );
}