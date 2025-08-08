import { supabase as supabaseClient } from '@/src/lib/supabase/client';
import type { 
  CustomSchema, 
  SchemaField, 
  BusinessRule, 
  SchemaImportData 
} from '@/src/types/schema';

export class SchemaService {
  private supabase = supabaseClient;

  // Schema CRUD operations
  async getSchemas() {
    const { data, error } = await this.supabase
      .from('custom_schemas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as CustomSchema[];
  }

  async getSchemaById(id: string) {
    const { data, error } = await this.supabase
      .from('custom_schemas')
      .select(`
        *,
        fields:schema_fields(*),
        business_rules:schema_business_rules(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CustomSchema & { 
      fields: SchemaField[]; 
      business_rules: BusinessRule[] 
    };
  }

  async createSchema(schema: Partial<CustomSchema>) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await this.supabase
      .from('custom_schemas')
      .insert({
        ...schema,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return data as CustomSchema;
  }

  async updateSchema(id: string, updates: Partial<CustomSchema>) {
    const { data, error } = await this.supabase
      .from('custom_schemas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CustomSchema;
  }

  async deleteSchema(id: string) {
    const { error } = await this.supabase
      .from('custom_schemas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Field CRUD operations
  async getSchemaFields(schemaId: string) {
    const { data, error } = await this.supabase
      .from('schema_fields')
      .select('*')
      .eq('schema_id', schemaId)
      .order('field_order', { ascending: true });

    if (error) throw error;
    return data as SchemaField[];
  }

  async createField(field: Partial<SchemaField>) {
    const { data, error } = await this.supabase
      .from('schema_fields')
      .insert(field)
      .select()
      .single();

    if (error) throw error;
    return data as SchemaField;
  }

  async updateField(id: string, updates: Partial<SchemaField>) {
    const { data, error } = await this.supabase
      .from('schema_fields')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as SchemaField;
  }

  async deleteField(id: string) {
    const { error } = await this.supabase
      .from('schema_fields')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async reorderFields(schemaId: string, fieldOrders: { id: string; order: number }[]) {
    const { error } = await this.supabase.rpc('batch_update_field_order', {
      schema_id: schemaId,
      field_orders: fieldOrders
    });

    if (error) throw error;
  }

  // Business Rules CRUD
  async getBusinessRules(schemaId: string) {
    const { data, error } = await this.supabase
      .from('schema_business_rules')
      .select('*')
      .eq('schema_id', schemaId)
      .order('priority', { ascending: true });

    if (error) throw error;
    return data as BusinessRule[];
  }

  async createBusinessRule(rule: Partial<BusinessRule>) {
    const { data, error } = await this.supabase
      .from('schema_business_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessRule;
  }

  async updateBusinessRule(id: string, updates: Partial<BusinessRule>) {
    const { data, error } = await this.supabase
      .from('schema_business_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as BusinessRule;
  }

  async deleteBusinessRule(id: string) {
    const { error } = await this.supabase
      .from('schema_business_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Import/Export functionality
  async importSchema(importData: SchemaImportData) {
    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Start a transaction-like operation
    try {
      // Create the schema
      const schema = await this.createSchema({
        name: importData.name,
        description: importData.description
      });

      // Create fields
      if (importData.fields && importData.fields.length > 0) {
        const fieldsToCreate = importData.fields.map((field, index) => ({
          ...field,
          schema_id: schema.id,
          field_order: index + 1
        }));

        const { error: fieldsError } = await this.supabase
          .from('schema_fields')
          .insert(fieldsToCreate);

        if (fieldsError) {
          // Rollback by deleting the schema
          await this.deleteSchema(schema.id);
          throw fieldsError;
        }
      }

      // Create business rules
      if (importData.business_rules && importData.business_rules.length > 0) {
        const rulesToCreate = importData.business_rules.map(rule => ({
          ...rule,
          schema_id: schema.id
        }));

        const { error: rulesError } = await this.supabase
          .from('schema_business_rules')
          .insert(rulesToCreate);

        if (rulesError) {
          // Rollback by deleting the schema
          await this.deleteSchema(schema.id);
          throw rulesError;
        }
      }

      return await this.getSchemaById(schema.id);
    } catch (error) {
      throw error;
    }
  }

  async exportSchema(id: string): Promise<SchemaImportData> {
    const schema = await this.getSchemaById(id);
    
    return {
      name: schema.name,
      description: schema.description,
      fields: schema.fields.map(field => {
        const { id, schema_id, created_at, updated_at, ...fieldData } = field;
        return fieldData;
      }),
      business_rules: schema.business_rules.map(rule => {
        const { id, schema_id, created_at, updated_at, ...ruleData } = rule;
        return ruleData;
      })
    };
  }

  // Clone a schema
  async cloneSchema(id: string, newName: string) {
    const originalSchema = await this.exportSchema(id);
    return await this.importSchema({
      ...originalSchema,
      name: newName
    });
  }
}

export const schemaService = new SchemaService();