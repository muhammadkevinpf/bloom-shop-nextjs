import { AuthTokens, ApiResponse, LoginPayload, RegisterPayload } from "@/types/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";

const AUTH_STORAGE_KEY = "bloom_auth_tokens";

/** Fired on window whenever the stored session changes, so UI state can follow. */
export const AUTH_CHANGE_EVENT = "bloom:auth-change";

function notifyAuthChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getStoredTokens(): AuthTokens | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: AuthTokens): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
  }
  notifyAuthChange();
}

export function clearTokens(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
  }
  notifyAuthChange();
}

export const authService = {
  async login(payload: LoginPayload): Promise<ApiResponse<AuthTokens>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<AuthTokens> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Login failed with status ${response.status}`);
    }

    if (data.data?.access_token) {
      saveTokens(data.data);
    }

    return data;
  },

  async register(payload: RegisterPayload): Promise<ApiResponse<AuthTokens>> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: ApiResponse<AuthTokens> = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || `Registration failed with status ${response.status}`);
    }

    if (data.data?.access_token) {
      saveTokens(data.data);
    }

    return data;
  },

  async refreshToken(refreshToken?: string): Promise<ApiResponse<AuthTokens>> {
    const token = refreshToken || getStoredTokens()?.refresh_token;

    if (!token) {
      throw new Error("No refresh token available");
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: token }),
    });

    const data: ApiResponse<AuthTokens> = await response.json();

    if (!response.ok || !data.success) {
      clearTokens();
      throw new Error(data.message || `Token refresh failed with status ${response.status}`);
    }

    if (data.data?.access_token) {
      saveTokens(data.data);
    }

    return data;
  },

  logout(): void {
    clearTokens();
  },
  isAuthenticated(): boolean {
    return !!getStoredTokens()?.access_token;
  },
};
