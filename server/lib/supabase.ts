import { createClient } from '@supabase/supabase-js';
import { env } from './env';

function isServiceRoleKey(key: string) {
  if (key.startsWith('sb_secret_')) return true;

  try {
    const payload = key.split('.')[1];
    if (!payload) return false;
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return claims.role === 'service_role';
  } catch {
    return false;
  }
}

const serviceRoleKey = isServiceRoleKey(env.supabaseKey) ? env.supabaseKey : '';

export const supabase =
  env.supabaseUrl && serviceRoleKey
    ? createClient(env.supabaseUrl, serviceRoleKey)
    : null;

export function hasSupabase() {
  return Boolean(supabase);
}
