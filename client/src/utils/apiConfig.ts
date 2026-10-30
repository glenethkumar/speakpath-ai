/**
 * SpeakPath AI - Centralized API & WebSocket Configuration
 * 
 * Supports:
 * 1. Decoupled Deployment: Frontend on Vercel, Backend on Render/Railway
 *    (via VITE_API_BASE_URL and VITE_WS_BASE_URL)
 * 2. Unified Deployment: Frontend and Backend on same origin
 * 3. Local Development: Vite proxy to http://localhost:5000
 */

export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
};

export const getWebSocketUrl = (path: string = '/api/live/ws'): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // 1. Explicit WebSocket URL override
  const envWs = import.meta.env.VITE_WS_BASE_URL;
  if (envWs && typeof envWs === 'string' && envWs.trim()) {
    return `${envWs.trim().replace(/\/+$/, '')}${cleanPath}`;
  }

  // 2. Derive WebSocket URL from API Base URL (e.g., https://... -> wss://...)
  const apiBase = getApiBaseUrl();
  if (apiBase) {
    const wsBase = apiBase
      .replace(/^http:\/\//i, 'ws://')
      .replace(/^https:\/\//i, 'wss://');
    return `${wsBase}${cleanPath}`;
  }

  // 3. Fallback to current browser window origin (Vite dev proxy or same-host deployment)
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}${cleanPath}`;
};

export const apiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return base ? `${base}${cleanPath}` : cleanPath;
};
