import axios, { type InternalAxiosRequestConfig } from 'axios';

export const api = axios.create({ baseURL: '/api' });

let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

export function setTokens(tokens: { accessToken: string; refreshToken: string } | null) {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
  if (tokens) {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  } else {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

let dangLamMoi: Promise<string> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && refreshToken) {
      original._retry = true;
      try {
        if (!dangLamMoi) {
          dangLamMoi = axios
            .post('/api/auth/refresh', { refreshToken })
            .then((r) => {
              setTokens(r.data);
              return r.data.accessToken as string;
            })
            .finally(() => {
              dangLamMoi = null;
            });
        }
        const newToken = await dangLamMoi;
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      } catch {
        setTokens(null);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);
