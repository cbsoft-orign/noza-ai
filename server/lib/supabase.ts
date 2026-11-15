import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase =
  env.supabaseUrl && env.supabaseKey && env.supabaseUrl !== 'https://example.supabase.co'
    ? createClient(env.supabaseUrl, env.supabaseKey)
    : null;

export function hasSupabase() {
  return Boolean(supabase);
}
