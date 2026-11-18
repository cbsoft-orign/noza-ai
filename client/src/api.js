export function apiUrl(path) {
  const base = import.meta.env.DEV
    ? ''
    : String(import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  return `${base}${path}`;
}
