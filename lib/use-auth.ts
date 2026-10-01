"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import * as authApi from "@/lib/auth-api";
import {
  clearAuthSession,
  getRefreshToken,
  readAuthSnapshot,
  roleHomePath,
  subscribeAuthStore,
  type AuthUser,
} from "@/lib/auth-store";
import { ApiError } from "@/lib/api";
import { isComingSoonMode } from "@/lib/coming-soon";

let hydrated = false;
let hydratePromise: Promise<void> | null = null;

async function hydrateOnce() {
  if (hydrated) return;
  if (hydratePromise) return hydratePromise;

  const task = (async () => {
    if (isComingSoonMode()) {
      hydrated = true;
      hydratePromise = null;
      return;
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      hydrated = true;
      return;
    }

    // BACKEND_LIVE — session restore via POST /auth/refresh
    try {
      await authApi.refresh();
    } catch {
      clearAuthSession();
    } finally {
      hydrated = true;
      hydratePromise = null;
    }
  })();

  hydratePromise = task;
  return task;
}

export function useAuth() {
  const [isHydrating, setIsHydrating] = useState(!hydrated);
  const user = useSyncExternalStore<AuthUser | null>(
    subscribeAuthStore,
    readAuthSnapshot,
    () => null
  );

  useEffect(() => {
    let active = true;

    if (hydrated) {
      setIsHydrating(false);
      return () => {
        active = false;
      };
    }

    setIsHydrating(true);
    void hydrateOnce().finally(() => {
      if (active) {
        setIsHydrating(false);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const hydrate = useCallback(async () => {
    await hydrateOnce();
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      fullName: string;
      phone: string;
      whatsappOptIn: boolean;
    }) => {
      return authApi.register(payload);
    },
    []
  );

  const verifyEmail = useCallback(async (payload: { userId: string; otp: string }) => {
    return authApi.verifyEmail(payload);
  }, []);

  const forgotPassword = useCallback(async (payload: { email: string }) => {
    return authApi.forgotPassword(payload);
  }, []);

  const resetPassword = useCallback(async (payload: { email: string; otp: string; newPassword: string }) => {
    return authApi.resetPassword(payload);
  }, []);

  const resendOtp = useCallback(async (payload: { userId: string; purpose: string }) => {
    return authApi.resendOtp(payload);
  }, []);

  const login = useCallback(async (payload: { email: string; password: string }) => {
    const nextUser = await authApi.login(payload);
    if (!nextUser) {
      throw new ApiError({
        code: "INVALID_AUTH_RESPONSE",
        message: "Login response did not include user data.",
        statusCode: 500,
      });
    }
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } finally {
      clearAuthSession();
    }
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    isHydrating,
    roleHomePath,
    register,
    verifyEmail,
    login,
    logout,
    forgotPassword,
    resetPassword,
    resendOtp,
    hydrate,
  };
}
