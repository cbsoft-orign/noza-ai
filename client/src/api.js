export function getBackendBaseUrl() {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BACKEND_URL) {
    return String(process.env.NEXT_PUBLIC_BACKEND_URL).replace(/\/$/, '');
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_BACKEND_URL) {
    return String(import.meta.env.NEXT_PUBLIC_BACKEND_URL).replace(/\/$/, '');
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return String(import.meta.env.VITE_API_URL).replace(/\/$/, '');
  }
  return '';
}

export function apiUrl(path) {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (base) {
    return `${base}${normalizedPath}`;
  }
  return normalizedPath;
}
