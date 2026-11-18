export function apiUrl(path) {
  const base = String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}
