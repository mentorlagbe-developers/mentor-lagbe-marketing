"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DashboardSectionContent } from "@/app/dashboard/_components/dashboard-section-content";
import {
  getDefaultSectionForRole,
  isRoleAllowedForSection,
  type DashboardSectionKey,
} from "@/app/dashboard/dashboard-menu";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import type { AuthUser, UserRole } from "@/lib/mock-auth";

function resolveRole(user: AuthUser | null): UserRole {
  return user?.role ?? "student";
}

function resolvePreviewRole(role: string | null): UserRole {
  if (role === "teacher" || role === "admin" || role === "superadmin") {
    return role;
  }
  return "student";
}

export default function DashboardSectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ section: string }>();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const role = user ? resolveRole(user) : resolvePreviewRole(searchParams.get("role"));
  const section = params.section;

  const isAllowed = useMemo(() => isRoleAllowedForSection(role, section), [role, section]);

  useEffect(() => {
    if (!isAllowed) {
      const defaultSection = getDefaultSectionForRole(role);
      const nextPath = `/dashboard/${defaultSection}${user ? "" : `?role=${role}`}`;
      router.replace(nextPath);
    }
  }, [isAllowed, role, router, user]);

  if (!isAllowed) {
    return null;
  }

  return <DashboardSectionContent section={section as DashboardSectionKey} role={role} />;
}
