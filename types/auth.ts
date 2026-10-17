export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
}

export interface RefreshTokenPayload {
    refreshToken: string;
}

export interface AuthTokens {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    token_type?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp?: string;
}

export interface AuthErrorResponse {
    message: string;
    status?: number;
    errors?: Record<string, string[]>;
}