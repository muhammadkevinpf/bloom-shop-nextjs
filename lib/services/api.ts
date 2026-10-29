import { ApiResponse } from "@/types/apiResponse";
import { authService, clearTokens, getStoredTokens } from "./auth";

/**
 * Empty by default so requests stay same-origin and are proxied by the route
 * handler in `app/api/v1/[...path]/route.ts` (Next -> API gateway ->
 * order/catalog service). Set NEXT_PUBLIC_API_URL only when the browser can
 * reach that origin directly: the order service rejects cross-origin calls
 * from http://localhost:3000.
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Your session has expired. Please sign in again.") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  /** Attach the stored access token and retry once after refreshing it. */
  auth?: boolean;
  signal?: AbortSignal;
}

async function parseEnvelope<T>(response: Response): Promise<ApiResponse<T> | null> {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ApiResponse<T>;
  } catch {
    return null;
  }
}

async function send(path: string, options: RequestOptions, token?: string): Promise<Response> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    cache: "no-store",
  });
}

async function refreshAccessToken(): Promise<string | null> {
  try {
    const res = await authService.refreshToken();
    return res.data?.access_token ?? null;
  } catch {
    clearTokens();
    return null;
  }
}

/**
 * Performs a request against the Bloom API and unwraps the shared
 * `{ success, message, data, timestamp }` envelope the backend returns.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const requiresAuth = options.auth ?? false;
  const token = requiresAuth ? getStoredTokens()?.access_token : undefined;

  if (requiresAuth && !token) throw new UnauthorizedError();

  let response = await send(path, options, token);

  if (response.status === 401 && requiresAuth) {
    const refreshedToken = await refreshAccessToken();
    if (!refreshedToken) throw new UnauthorizedError();
    response = await send(path, options, refreshedToken);

    // A 401 after a successful refresh means the session itself is no longer
    // valid, so clear it rather than leaving a broken token in place.
    if (response.status === 401) {
      clearTokens();
      throw new UnauthorizedError();
    }
  }

  const envelope = await parseEnvelope<T>(response);

  if (!response.ok || !envelope?.success) {
    const message = envelope?.message || `Request failed with status ${response.status}`;
    throw response.status === 401 ? new UnauthorizedError(message) : new ApiError(message, response.status);
  }

  return envelope;
}
