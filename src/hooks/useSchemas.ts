import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schemaService } from '@/src/services/schemas';
import type { CustomSchema, SchemaImportData } from '@/src/types/schema';

export function useSchemas() {
  return useQuery({
    queryKey: ['schemas'],
    queryFn: async () => {
      const response = await fetch('/api/schemas');
      if (!response.ok) {
        throw new Error('Failed to fetch schemas');
      }
      const data = await response.json();
      return data.schemas as CustomSchema[];
    },
  });
}

export function useSchema(id: string) {
  return useQuery({
    queryKey: ['schemas', id],
    queryFn: async () => {
      const response = await fetch(`/api/schemas/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch schema');
      }
      const data = await response.json();
      return data.schema;
    },
    enabled: !!id,
  });
}

export function useCreateSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (schema: Partial<CustomSchema>) => {
      const response = await fetch('/api/schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schema),
      });

      if (!response.ok) {
        throw new Error('Failed to create schema');
      }

      const data = await response.json();
      return data.schema;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
    },
  });
}

export function useUpdateSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CustomSchema> }) => {
      const response = await fetch(`/api/schemas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update schema');
      }

      const data = await response.json();
      return data.schema;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
      queryClient.invalidateQueries({ queryKey: ['schemas', variables.id] });
    },
  });
}

export function useDeleteSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/schemas/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete schema');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
    },
  });
}

export function useImportSchema() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (importData: SchemaImportData) => {
      const response = await fetch('/api/schemas/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(importData),
      });

      if (!response.ok) {
        throw new Error('Failed to import schema');
      }

      const data = await response.json();
      return data.schema;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schemas'] });
    },
  });
}

export function useExportSchema() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/schemas/export/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to export schema');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `schema-${id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}