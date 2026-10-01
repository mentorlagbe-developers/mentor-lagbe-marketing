"use client";

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/auth-store";
import { isComingSoonMode } from "@/lib/coming-soon";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export type ApiErrorPayload = {
  code: string;
  message: string;
  statusCode: number;
  details?: Array<{ field?: string; message?: string }>;
  meta?: Record<string, unknown>;
};

export class ApiError extends Error {
  code: string;
  statusCode: number;
  details?: Array<{ field?: string; message?: string }>;
  meta?: Record<string, unknown>;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.code = payload.code;
    this.statusCode = payload.statusCode;
    this.details = payload.details;
    this.meta = payload.meta;
  }
}

type ApiEnvelope<T> =
  | { success: true; data: T }
  | {
      success: false;
      error: {
        code?: string;
        message?: string;
        statusCode?: number;
        details?: Array<{ field?: string; message?: string }>;
        meta?: Record<string, unknown>;
      };
    };

type RequestOptions = RequestInit & {
  auth?: boolean;
  _retried?: boolean;
};

function toApiError(status: number, envelope?: ApiEnvelope<unknown>) {
  const payload =
    envelope && "error" in envelope
      ? envelope.error
      : { code: "UNKNOWN_ERROR", message: "Something went wrong.", statusCode: status };

  return new ApiError({
    code: payload.code ?? "UNKNOWN_ERROR",
    message: payload.message ?? "Something went wrong.",
    statusCode: payload.statusCode ?? status,
    details: payload.details,
    meta: payload.meta,
  });
}

function isExpiredTokenError(error: ApiError) {
  if (error.code === "ACCESS_TOKEN_EXPIRED") return true;
  return error.message.toLowerCase().includes("jwt expired");
}

// BACKEND_LIVE — token refresh (skipped when NEXT_PUBLIC_COMING_SOON=true)
async function refreshAccessToken() {
  if (isComingSoonMode()) {
    return false;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  let payload: ApiEnvelope<Record<string, unknown>> | undefined;
  try {
    payload = (await response.json()) as ApiEnvelope<Record<string, unknown>>;
  } catch {
    payload = undefined;
  }

  if (!response.ok || !payload || !("success" in payload) || !payload.success) {
    clearAuthSession();
    return false;
  }

  const nextAccessToken =
    typeof payload.data.accessToken === "string"
      ? payload.data.accessToken
      : null;
  const nextRefreshToken =
    typeof payload.data.refreshToken === "string"
      ? payload.data.refreshToken
      : refreshToken;

  if (!nextAccessToken) {
    clearAuthSession();
    return false;
  }

  setAccessToken(nextAccessToken);
  setRefreshToken(nextRefreshToken);
  return true;
}

// BACKEND_LIVE — all HTTP API calls (throws COMING_SOON when flag is on)
export async function apiFetch<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  if (isComingSoonMode()) {
    throw new ApiError({
      code: "COMING_SOON",
      message:
        "Mentor Lagbe one-to-one booking is launching soon. The app is not connected to the server right now.",
      statusCode: 503,
    });
  }

  const { auth = false, _retried = false, headers, body, ...rest } = options;
  const requestHeaders = new Headers(headers ?? {});
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  if (!isFormData && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const accessToken = getAccessToken();
    if (accessToken) {
      requestHeaders.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    headers: requestHeaders,
  });

  let payload: ApiEnvelope<T> | undefined;
  try {
    payload = (await response.json()) as ApiEnvelope<T>;
  } catch {
    payload = undefined;
  }

  if (response.ok && payload && "success" in payload && payload.success) {
    return payload.data;
  }

  const apiError = toApiError(response.status, payload as ApiEnvelope<unknown>);

  if (auth && !_retried && response.status === 401 && isExpiredTokenError(apiError)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return apiFetch<T>(path, { ...options, _retried: true });
    }
    clearAuthSession();
  }

  throw apiError;
}
