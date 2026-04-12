/**
 * Supabase database types.
 *
 * TODO: Generate this file from the live database schema:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * For now, this is a permissive placeholder that allows any table/view/function
 * name. This unblocks the build while proper types are not yet generated.
 * Replace with generated types for full type safety.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GenericTable {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GenericFunction {
  Args: Record<string, unknown>;
  Returns: unknown;
}

export interface Database {
  public: {
    Tables: Record<string, GenericTable>;
    Views: Record<string, GenericTable>;
    Functions: Record<string, GenericFunction>;
    Enums: Record<string, string>;
  };
}
