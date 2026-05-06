export type Gender = "male" | "female" | "other";

type StoredUser = {
  id: string;
  fullName: string;
  email: string;
  age: number;
  gender: Gender;
  phone: string;
  password: string;
  verifiedAt: string;
  createdAt: string;
  avatarSeed: string;
};

export type AuthUser = Omit<StoredUser, "password">;

type RegisterPayload = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
};

const USERS_KEY = "mentorlagbe-users";
const CURRENT_USER_KEY = "mentorlagbe-current-user";
const AUTH_EVENT = "mentorlagbe-auth-change";
let cachedCurrentUserRaw: string | null | undefined;
let cachedCurrentUserSnapshot: AuthUser | null = null;

function hasWindow() {
  return typeof window !== "undefined";
}

function stripPassword(user: StoredUser): AuthUser {
  const { password, ...rest } = user;
  void password;
  return rest;
}

function notifyAuthChange() {
  if (!hasWindow()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_EVENT));
}

function readUsers(): StoredUser[] {
  if (!hasWindow()) {
    return [];
  }

  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<StoredUser>>;

    // Backward-compatible migration for legacy users saved before `email` existed.
    return parsed.map((user) => ({
      id: user.id ?? crypto.randomUUID(),
      fullName: user.fullName ?? "Student",
      email:
        typeof user.email === "string" && user.email.trim()
          ? user.email.trim().toLowerCase()
          : `${(user.phone ?? "user").replace(/[^\d]/g, "")}@mentorlagbe.local`,
      age: typeof user.age === "number" ? user.age : 0,
      gender: user.gender ?? "other",
      phone: user.phone ?? "",
      password: user.password ?? "",
      verifiedAt: user.verifiedAt ?? new Date().toISOString(),
      createdAt: user.createdAt ?? new Date().toISOString(),
      avatarSeed: user.avatarSeed ?? "ML",
    }));
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  notifyAuthChange();
}

export function normalizePhone(input: string) {
  return input.replace(/[^\d+]/g, "");
}

export function ensureDemoUser() {
  if (!hasWindow()) {
    return;
  }

  const users = readUsers();
  const demoPhone = "01409365577";

  if (users.some((user) => user.phone === demoPhone)) {
    return;
  }

  const now = new Date().toISOString();

  users.push({
    id: crypto.randomUUID(),
    fullName: "Demo Student",
    email: "demo@mentorlagbe.com",
    age: 21,
    gender: "male",
    phone: demoPhone,
    password: "demo1234",
    verifiedAt: now,
    createdAt: now,
    avatarSeed: "DS",
  });

  writeUsers(users);
}

export function getCurrentUser(): AuthUser | null {
  if (!hasWindow()) {
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null) {
  if (!hasWindow()) {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(CURRENT_USER_KEY);
    notifyAuthChange();
    return;
  }

  window.localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  notifyAuthChange();
}

export function authenticateUser(phone: string, password: string): AuthUser | null {
  const normalizedPhone = normalizePhone(phone);
  const user = readUsers().find(
    (item) => item.phone === normalizedPhone && item.password === password
  );

  if (!user) {
    return null;
  }

  const safeUser = stripPassword(user);
  setCurrentUser(safeUser);
  return safeUser;
}

export function registerUser(payload: RegisterPayload): AuthUser {
  const users = readUsers();
  const normalizedPhone = normalizePhone(payload.phone);
  const normalizedEmail = payload.email.trim().toLowerCase();

  if (users.some((user) => user.phone === normalizedPhone)) {
    throw new Error("An account with this phone number already exists.");
  }

  if (users.some((user) => (user.email ?? "").toLowerCase() === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const now = new Date().toISOString();
  const nextUser: StoredUser = {
    id: crypto.randomUUID(),
    fullName: payload.fullName,
    email: normalizedEmail,
    age: 0,
    gender: "other",
    phone: normalizedPhone,
    password: payload.password,
    verifiedAt: now,
    createdAt: now,
    avatarSeed: payload.fullName
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(""),
  };

  writeUsers([...users, nextUser]);

  const safeUser = stripPassword(nextUser);
  setCurrentUser(safeUser);
  return safeUser;
}

export function updateUserPassword(phone: string, nextPassword: string) {
  const normalizedPhone = normalizePhone(phone);
  const users = readUsers();
  const targetIndex = users.findIndex((user) => user.phone === normalizedPhone);

  if (targetIndex === -1) {
    throw new Error("No account found with this phone number.");
  }

  users[targetIndex] = {
    ...users[targetIndex],
    password: nextPassword,
  };

  writeUsers(users);
}

export function userExists(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  return readUsers().some((user) => user.phone === normalizedPhone);
}

export function subscribeAuthStore(callback: () => void) {
  if (!hasWindow()) {
    return () => undefined;
  }

  const handler = () => callback();
  window.addEventListener(AUTH_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(AUTH_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function readAuthSnapshot() {
  // getSnapshot for useSyncExternalStore must be pure and stable.
  if (!hasWindow()) {
    return null;
  }

  const raw = window.localStorage.getItem(CURRENT_USER_KEY);
  if (raw === cachedCurrentUserRaw) {
    return cachedCurrentUserSnapshot;
  }

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
