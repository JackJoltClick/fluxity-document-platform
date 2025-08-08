'use client';

import { useState } from 'react';
import { SchemaActions } from './SchemaActions';
import type { CustomSchema } from '@/src/types/schema';
import { DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface SchemaCardProps {
  schema: CustomSchema;
}

export function SchemaCard({ schema }: SchemaCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {schema.name}
            </h3>
            {schema.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {schema.description}
              </p>
            )}
          </div>
          {isHovered && (
            <SchemaActions schema={schema} />
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <DocumentTextIcon className="h-4 w-4" />
              <span>{schema.fields?.length || 0} fields</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{new Date(schema.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex items-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              schema.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {schema.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}