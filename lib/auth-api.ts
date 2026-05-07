"use client";

import { apiFetch } from "@/lib/api";
import {
  getCurrentUser,
  mapApiUser,
  setAccessToken,
  setCurrentUser,
  setRefreshToken,
  type AuthUser,
} from "@/lib/auth-store";

type AuthData = {
  accessToken?: string;
  refreshToken?: string;
  user?: Record<string, unknown>;
  readableId?: string;
  readableID?: string;
  readable_id?: string;
  userReadableId?: string;
};

function persistAuthFromData(data: AuthData): AuthUser | null {
  if (typeof data.accessToken === "string") {
    setAccessToken(data.accessToken);
  }
  if (typeof data.refreshToken === "string") {
    setRefreshToken(data.refreshToken);
  }
  const existing = getCurrentUser();
  if (data.user) {
    const incoming = mapApiUser(data.user);
    const readableIdFromEnvelope =
      data.readableId ?? data.readableID ?? data.readable_id ?? data.userReadableId;
    const finalUser: AuthUser = {
      ...existing,
      ...incoming,
      // Preserve previous values when refresh payload omits fields.
      readableId:
        incoming.readableId ||
        (typeof readableIdFromEnvelope === "string" ? readableIdFromEnvelope : undefined) ||
        existing?.readableId,
      email: incoming.email || existing?.email || "",
      fullName: incoming.fullName || existing?.fullName || "User",
    };
    setCurrentUser(finalUser);
    return finalUser;
  }
  return existing;
}

export async function register(payload: {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}) {
  return apiFetch<{ userId: string; message?: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyEmail(payload: { userId: string; otp: string }) {
  return apiFetch<{ verified: boolean; message?: string }>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string }): Promise<AuthUser> {
  const data = await apiFetch<AuthData>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  const finalUser = persistAuthFromData(data);
  if (!finalUser) {
    throw new Error("Login response did not include user.");
  }
  return finalUser;
}

export async function refresh() {
  const refreshToken =
    typeof window === "undefined"
      ? null
      : window.localStorage.getItem("mentorlagbe-refresh-token");
  if (!refreshToken) return null;

  const data = await apiFetch<AuthData>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  persistAuthFromData(data);
  return data.user ? mapApiUser(data.user) : null;
}

export async function logout(payload: { refreshToken: string }) {
  await apiFetch<{ loggedOut: boolean }>("/auth/logout", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function forgotPassword(payload: { email: string }) {
  return apiFetch<{ message?: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetPassword(payload: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return apiFetch<{ message?: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resendOtp(payload: { userId: string; purpose: string }) {
  return apiFetch<{ message?: string }>("/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
