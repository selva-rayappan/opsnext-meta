import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';

// ---------------------------------------------------------------------------
// In-memory access token store — never touches localStorage / sessionStorage
// ---------------------------------------------------------------------------
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string): void {
  _accessToken = token;
}

export function clearAccessToken(): void {
  _accessToken = null;
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
  withCredentials: true, // send cookies (refresh token httpOnly cookie)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer token
// ---------------------------------------------------------------------------
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — transparent token refresh on 401
// ---------------------------------------------------------------------------
let _refreshPromise: Promise<string> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Deduplicate concurrent refresh calls
        if (!_refreshPromise) {
          _refreshPromise = refreshAccessToken().finally(() => {
            _refreshPromise = null;
          });
        }
        const newToken = await _refreshPromise;
        if (originalRequest.headers) {
          (originalRequest.headers as Record<string, string>)[
            'Authorization'
          ] = `Bearer ${newToken}`;
        } else {
          originalRequest.headers = { Authorization: `Bearer ${newToken}` };
        }
        return api(originalRequest);
      } catch {
        // Refresh failed — clear token and redirect to login
        clearAccessToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

// ---------------------------------------------------------------------------
// Refresh helper (defined here to avoid circular imports from auth.ts)
// ---------------------------------------------------------------------------
async function refreshAccessToken(): Promise<string> {
  // POST without Authorization header — use a plain axios call so we don't
  // trigger another 401 intercept loop.
  const response = await axios.post<{ accessToken: string }>(
    `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const token = response.data.accessToken;
  setAccessToken(token);
  return token;
}

export default api;
