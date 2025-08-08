'use client';

import { useState } from 'react';
// Temporary: using mock hooks for testing UI
import { useDeleteSchema, useUpdateSchema, useExportSchema } from '@/src/hooks/useSchemas.mock';
import type { CustomSchema } from '@/src/types/schema';
import { 
  EllipsisVerticalIcon, 
  PencilIcon, 
  TrashIcon, 
  DocumentDuplicateIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface SchemaActionsProps {
  schema: CustomSchema;
}

export function SchemaActions({ schema }: SchemaActionsProps) {
  const [showMenu, setShowMenu] = useState(false);
  const deleteSchema = useDeleteSchema();
  const updateSchema = useUpdateSchema();
  const exportSchema = useExportSchema();

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this schema?')) {
      await deleteSchema.mutateAsync(schema.id);
    }
  };

  const handleToggleActive = async () => {
    await updateSchema.mutateAsync({
      id: schema.id,
      updates: { is_active: !schema.is_active }
    });
  };

  const handleExport = async () => {
    await exportSchema.mutateAsync(schema.id);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500" />
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu">
              <button
                onClick={() => {
                  // TODO: Implement edit functionality
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <PencilIcon className="h-4 w-4 mr-3" />
                Edit
              </button>

              <button
                onClick={() => {
                  // TODO: Implement clone functionality
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <DocumentDuplicateIcon className="h-4 w-4 mr-3" />
                Clone
              </button>

              <button
                onClick={() => {
                  handleExport();
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-3" />
                Export
              </button>

              <button
                onClick={() => {
                  handleToggleActive();
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {schema.is_active ? (
                  <>
                    <XMarkIcon className="h-4 w-4 mr-3" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 mr-3" />
                    Activate
                  </>
                )}
              </button>

              <hr className="my-1" />

              <button
                onClick={() => {
                  handleDelete();
                  setShowMenu(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <TrashIcon className="h-4 w-4 mr-3" />
                Delete
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}