// Mock version for testing UI without database
import { useState } from 'react';
import type { CustomSchema, SchemaImportData } from '@/src/types/schema';

const mockSchemas: CustomSchema[] = [
  {
    id: '1',
    user_id: 'user1',
    name: 'Invoice Processing Schema',
    description: 'Standard invoice processing with vendor and GL account mapping',
    is_active: true,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    fields: [],
  },
  {
    id: '2',
    user_id: 'user1',
    name: 'Purchase Order Schema',
    description: 'Purchase order processing with cost center tracking',
    is_active: false,
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z',
    fields: [],
  }
];

export function useSchemas() {
  return {
    data: mockSchemas,
    isLoading: false,
    error: null,
  };
}

export function useSchema(id: string) {
  const schema = mockSchemas.find(s => s.id === id);
  return {
    data: schema,
    isLoading: false,
    error: null,
  };
}

export function useCreateSchema() {
  return {
    mutateAsync: async (schema: Partial<CustomSchema>) => {
      console.log('Mock creating schema:', schema);
      return Promise.resolve({
        id: Date.now().toString(),
        user_id: 'user1',
        ...schema,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    isPending: false,
  };
}

export function useUpdateSchema() {
  return {
    mutateAsync: async ({ id, updates }: { id: string; updates: Partial<CustomSchema> }) => {
      console.log('Mock updating schema:', id, updates);
      return Promise.resolve({ id, ...updates });
    },
    isPending: false,
  };
}

export function useDeleteSchema() {
  return {
    mutateAsync: async (id: string) => {
      console.log('Mock deleting schema:', id);
      return Promise.resolve();
    },
    isPending: false,
  };
}

export function useImportSchema() {
  return {
    mutateAsync: async (importData: SchemaImportData) => {
      console.log('Mock importing schema:', importData);
      return Promise.resolve({
        id: Date.now().toString(),
        user_id: 'user1',
        ...importData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    isPending: false,
  };
}

export function useExportSchema() {
  return {
    mutateAsync: async (id: string) => {
      console.log('Mock exporting schema:', id);
      // Create a mock JSON download
      const mockData = {
        name: 'Mock Schema',
        description: 'Mock exported schema',
        fields: [],
        business_rules: [],
      };
      const blob = new Blob([JSON.stringify(mockData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schema-${id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return Promise.resolve();
    },
    isPending: false,
  };
}