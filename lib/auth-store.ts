"use client";

export type Gender = "male" | "female" | "other";
export type UserRole = "student" | "teacher" | "admin" | "superadmin";

export type AuthUser = {
  id: string;
  readableId?: string;
  fullName: string;
  email: string;
  profilePictureUrl?: string;
  age: number;
  gender: Gender;
  phone: string;
  verifiedAt: string;
  createdAt: string;
  avatarSeed: string;
  role: UserRole;
};

const AUTH_EVENT = "mentorlagbe-auth-change";
const CURRENT_USER_KEY = "mentorlagbe-current-user";
const REFRESH_TOKEN_KEY = "mentorlagbe-refresh-token";

let accessTokenMemory: string | null = null;
let cachedCurrentUserRaw: string | null | undefined;
let cachedCurrentUserSnapshot: AuthUser | null = null;

function hasWindow() {
  return typeof window !== "undefined";
}

function dispatchAuthChange() {
  if (!hasWindow()) return;
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function safeLocalStorageGet(key: string) {
  if (!hasWindow()) return null;
  return window.localStorage.getItem(key);
}

function safeLocalStorageSet(key: string, value: string) {
  if (!hasWindow()) return;
  window.localStorage.setItem(key, value);
}

function safeLocalStorageRemove(key: string) {
  if (!hasWindow()) return;
  window.localStorage.removeItem(key);
}

export function normalizeBackendRole(role: string | undefined): UserRole {
  if (role === "mentor" || role === "teacher") return "teacher";
  if (role === "admin") return "admin";
  if (role === "super_admin" || role === "superadmin") return "superadmin";
  return "student";
}

export function toDashboardRoleQuery(role: UserRole) {
  if (role === "teacher") return "teacher";
  if (role === "admin") return "admin";
  if (role === "superadmin") return "superadmin";
  return "student";
}

export function roleHomePath(role: UserRole) {
  if (role === "teacher") return "/mentor";
  if (role === "admin" || role === "superadmin") return "/admin";
  return "/student";
}

export function buildAvatarSeed(fullName: string) {
  return (
    fullName
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "ML"
  );
}

export function mapApiUser(payload: Record<string, unknown>): AuthUser {
  const fullName = String(payload.fullName ?? payload.name ?? "User");
  const role = normalizeBackendRole(
    typeof payload.role === "string" ? payload.role : undefined
  );
  const profile =
    payload.profile && typeof payload.profile === "object"
      ? (payload.profile as Record<string, unknown>)
      : null;
  const readableIdValue =
    payload.readableId ??
    payload.readableID ??
    payload.readable_id ??
    payload.userReadableId ??
    payload.readableid ??
    profile?.readableId ??
    profile?.readableID ??
    profile?.readable_id;

  return {
    id: String(payload.id ?? payload.userId ?? crypto.randomUUID()),
    readableId:
      readableIdValue !== undefined &&
      readableIdValue !== null &&
      String(readableIdValue).trim()
        ? String(readableIdValue).trim()
        : undefined,
    fullName,
    email: String(payload.email ?? ""),
    profilePictureUrl:
      typeof payload.profilePictureUrl === "string" && payload.profilePictureUrl.trim()
        ? payload.profilePictureUrl.trim()
        : "",
    age: Number(payload.age ?? 0),
    gender:
      payload.gender === "male" || payload.gender === "female" || payload.gender === "other"
        ? payload.gender
        : "other",
    phone: String(payload.phone ?? ""),
    verifiedAt: String(payload.verifiedAt ?? new Date().toISOString()),
    createdAt: String(payload.createdAt ?? new Date().toISOString()),
    avatarSeed: String(payload.avatarSeed ?? buildAvatarSeed(fullName)),
    role,
  };
}

export function getAccessToken() {
  return accessTokenMemory;
}

export function setAccessToken(token: string | null) {
  accessTokenMemory = token;
  dispatchAuthChange();
}

export function getRefreshToken() {
  return safeLocalStorageGet(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (!token) {
    safeLocalStorageRemove(REFRESH_TOKEN_KEY);
  } else {
    safeLocalStorageSet(REFRESH_TOKEN_KEY, token);
  }
}

export function getCurrentUser(): AuthUser | null {
  const raw = safeLocalStorageGet(CURRENT_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null) {
  if (!user) {
    safeLocalStorageRemove(CURRENT_USER_KEY);
  } else {
    safeLocalStorageSet(CURRENT_USER_KEY, JSON.stringify(user));
  }
  dispatchAuthChange();
}

export function clearAuthSession() {
  accessTokenMemory = null;
  safeLocalStorageRemove(CURRENT_USER_KEY);
  safeLocalStorageRemove(REFRESH_TOKEN_KEY);
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("ml_mentor_status_confirmed_shown");
  }
  dispatchAuthChange();
}

export function subscribeAuthStore(callback: () => void) {
  if (!hasWindow()) return () => undefined;
  const handler = () => callback();
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function readAuthSnapshot() {
  if (!hasWindow()) return null;
  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (raw === cachedCurrentUserRaw) return cachedCurrentUserSnapshot;
  cachedCurrentUserRaw = raw;
  if (!raw) {
    cachedCurrentUserSnapshot = null;
    return cachedCurrentUserSnapshot;
  }
  try {
    cachedCurrentUserSnapshot = JSON.parse(raw) as AuthUser;
  } catch {
    cachedCurrentUserSnapshot = null;
  }
  return cachedCurrentUserSnapshot;
}
