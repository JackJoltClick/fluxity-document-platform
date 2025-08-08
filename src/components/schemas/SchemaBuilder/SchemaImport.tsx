'use client';

import { useState } from 'react';
// Temporary: using mock hooks for testing UI
import { useImportSchema } from '@/src/hooks/useSchemas.mock';
import { Button } from '@/src/components/design-system/foundations/Button';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import type { SchemaImportData } from '@/src/types/schema';

interface SchemaImportProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SchemaImport({ onSuccess, onCancel }: SchemaImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const importSchema = useImportSchema();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/json') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Please select a JSON file');
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      const content = await file.text();
      const data = JSON.parse(content) as SchemaImportData;
      
      await importSchema.mutateAsync(data);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid JSON file');
      } else {
        setError('Failed to import schema');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Import Schema</h2>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
            Select JSON file
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".json"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">JSON files only</p>
            </div>
          </div>
        </div>

        {file && (
          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-700">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleImport}
            disabled={!file || importSchema.isPending}
            loading={importSchema.isPending}
          >
            Import Schema
          </Button>
        </div>
      </div>
    </div>
  );
}