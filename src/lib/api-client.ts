/**
 * Typed API client for frontend components.
 * Centralizes auth headers, error handling, and base URL.
 */

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      console.log('[api-client] token set:', token ? `${token.slice(0, 10)}...` : 'null');
    }
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = {};
    if (this.token) h['Authorization'] = `Bearer ${this.token}`;
    return { ...h, ...extra };
  }

  async request<T = unknown>(method: HttpMethod, url: string, body?: unknown): Promise<T> {
    const res = await fetch(url, {
      method,
      headers: this.headers(body ? { 'Content-Type': 'application/json' } : undefined),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || `Request failed: ${res.status}`, res.status);
    }

    return res.json();
  }

  get<T = unknown>(url: string) { return this.request<T>('GET', url); }
  post<T = unknown>(url: string, body?: unknown) { return this.request<T>('POST', url, body); }
  patch<T = unknown>(url: string, body?: unknown) { return this.request<T>('PATCH', url, body); }
  del<T = unknown>(url: string) { return this.request<T>('DELETE', url); }

  /**
   * Upload FormData (no JSON content-type header)
   */
  async upload<T = unknown>(url: string, formData: FormData): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || `Upload failed: ${res.status}`, res.status);
    }

    return res.json();
  }
}

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Singleton API client */
export const api = new ApiClient();
