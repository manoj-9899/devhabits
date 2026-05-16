// src/lib/dataMode.ts
import { supabase, supabaseConfigured } from './supabase';

/** When true, habits/logs use Supabase (per-user) instead of the Express API. */
export async function useCloudData(): Promise<boolean> {
  if (!supabaseConfigured) return false;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return Boolean(session);
}
