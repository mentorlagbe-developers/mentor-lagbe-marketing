"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getDefaultSectionForRole } from "@/app/dashboard/dashboard-menu";
import type { AuthUser, UserRole } from "@/lib/mock-auth";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";

function resolveRole(user: AuthUser | null): UserRole {
  return user?.role ?? "student";
}

function resolvePreviewRole(role: string | null): UserRole {
  if (role === "teacher" || role === "admin" || role === "superadmin") {
    return role;
  }
  return "student";
}

export default function DashboardRootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);

  useEffect(() => {
    const role = user ? resolveRole(user) : resolvePreviewRole(searchParams.get("role"));
    const defaultSection = getDefaultSectionForRole(role);
    const nextPath = `/dashboard/${defaultSection}${user ? "" : `?role=${role}`}`;
    router.replace(nextPath);
  }, [router, searchParams, user]);

  return null;
}
