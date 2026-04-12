/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Supabase database types — PERMISSIVE PLACEHOLDER.
 *
 * TODO: Generate proper types from the live database:
 *   npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/supabase/types.ts
 *
 * This placeholder uses `any` for all table operations to unblock the build.
 * It provides NO type safety for database queries — that's the trade-off
 * until proper types are generated.
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = any;

/**
 * Helper for calling custom RPC functions not in auto-generated types.
 *   await rpc(supabase, 'function_name', { arg: value });
 */
export function rpc(client: any, fn: string, args?: Record<string, unknown>) {
  return client.rpc(fn, args);
}
