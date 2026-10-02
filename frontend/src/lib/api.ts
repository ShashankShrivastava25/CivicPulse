export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api';
const BASE = API_BASE;

export class ApiError extends Error {
  constructor(public status: number, message: string, public fieldErrors?: Record<string, string[]>) { super(message); }
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method: opts.method ?? 'GET', credentials: 'include',
      headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again');
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, json?.message ?? 'Something went wrong. Please try again', json?.errors);
  return (json?.data ?? json) as T;
}
