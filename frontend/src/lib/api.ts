import axios, { AxiosError } from 'axios';

// Development: Vite proksi (/api). Production: VITE_API_URL yoki shu domen.
const baseURL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

export const api = axios.create({ baseURL, withCredentials: true, timeout: 60_000 });

export interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

api.interceptors.response.use(
  (r) => r,
  (err: AxiosError<ApiErrorBody>) => {
    if (err.response) {
      const body = err.response.data?.error;
      return Promise.reject(new ApiError(err.response.status, body?.code ?? 'ERROR', body?.message ?? err.message, body?.details));
    }
    return Promise.reject(new ApiError(0, 'NETWORK', "Server bilan aloqa yo'q. Internet yoki serverni tekshiring."));
  }
);

export const errorMessage = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : String(e));

/** Qisqa yordamchilar: data ni qaytaradi */
export const get = <T,>(url: string, params?: Record<string, unknown>) => api.get<T>(url, { params }).then((r) => r.data);
export const post = <T,>(url: string, body?: unknown) => api.post<T>(url, body).then((r) => r.data);
export const put = <T,>(url: string, body?: unknown) => api.put<T>(url, body).then((r) => r.data);
export const patch = <T,>(url: string, body?: unknown) => api.patch<T>(url, body).then((r) => r.data);
export const del = <T,>(url: string) => api.delete<T>(url).then((r) => r.data);

export const apiUrl = (path: string) => `${baseURL.replace(/\/$/, '')}${path}`;
