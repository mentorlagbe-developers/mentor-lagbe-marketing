"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardSectionContent } from "@/app/dashboard/_components/dashboard-section-content";
import {
  getDefaultSectionForRole,
  isRoleAllowedForSection,
  type DashboardSectionKey,
} from "@/app/dashboard/dashboard-menu";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import type { AuthUser, UserRole } from "@/lib/mock-auth";
import { useAuth } from "@/lib/use-auth";

function resolveRole(user: AuthUser | null): UserRole {
  return user?.role ?? "student";
}

export default function DashboardSectionPage() {
  const router = useRouter();
  const { isHydrating } = useAuth();
  const params = useParams<{ section: string }>();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const role = resolveRole(user);
  const section = params.section;

  const isAllowed = useMemo(() => isRoleAllowedForSection(role, section), [role, section]);

  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/?auth=login");
      return;
    }
    if (!isAllowed) {
      const defaultSection = getDefaultSectionForRole(role);
      const nextPath = `/dashboard/${defaultSection}`;
      router.replace(nextPath);
    }
  }, [isAllowed, isHydrating, role, router, user]);

  if (isHydrating || !user || !isAllowed) {
    return <div className="p-6 text-sm text-slate-500">Loading dashboard...</div>;
  }

  return <DashboardSectionContent section={section as DashboardSectionKey} role={role} />;
}
