/**
 * Supabase database types.
 *
 * TODO: Generate this file from the live database schema:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * For now, this is a permissive placeholder that allows any table/view name.
 * Replace with generated types for full type safety.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

interface GenericTable {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
}

export interface Database {
  public: {
    Tables: Record<string, GenericTable>;
    Views: Record<string, GenericTable>;
    Functions: Record<string, never>;
    Enums: Record<string, string>;
  };
}

/**
 * Helper type for calling custom RPC functions that aren't in the
 * auto-generated types yet. Use:
 *   await rpc(supabase, 'function_name', { arg: value });
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rpc(client: any, fn: string, args?: Record<string, unknown>) {
  return client.rpc(fn, args);
}
