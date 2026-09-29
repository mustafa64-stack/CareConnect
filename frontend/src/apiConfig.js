// Golden Hour API Configuration
// Automatically routes to local proxy when testing on localhost,
// and directly to the live Render backend in production on Vercel.

export const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? ''
    : 'https://goldenhour-backend-fm33.onrender.com';

export function apiUrl(path) {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${cleanPath}`;
}

export default apiUrl;
