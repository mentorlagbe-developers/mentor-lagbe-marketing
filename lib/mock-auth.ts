export type { AuthUser, Gender, UserRole } from "@/lib/auth-store";
export {
  getCurrentUser,
  readAuthSnapshot,
  setCurrentUser,
  subscribeAuthStore,
} from "@/lib/auth-store";

export function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "");
}

// Legacy placeholders kept to avoid breaking imports during migration.
export function ensureDemoUser() {}

export function authenticateUser() {
  throw new Error("authenticateUser is deprecated. Use useAuth().login.");
}

export function registerUser() {
  throw new Error("registerUser is deprecated. Use useAuth().register.");
}

export function updateUserPassword() {
  throw new Error("updateUserPassword is deprecated. Use useAuth().resetPassword.");
}

export function userExists() {
  return false;
}
