"use client";

import { useState, useSyncExternalStore } from "react";
import { DashboardSectionContent } from "@/app/dashboard/_components/dashboard-section-content";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import type { AuthUser, UserRole } from "@/lib/mock-auth";

function resolveRole(user: AuthUser | null, roleQuery: string | null): UserRole {
  if (user?.role) {
    return user.role;
  }
  if (roleQuery === "teacher" || roleQuery === "admin" || roleQuery === "superadmin") {
    return roleQuery;
  }
  return "student";
}

export default function DashboardStaticPage() {
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const [roleQuery] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const query = new URLSearchParams(window.location.search);
    return query.get("role");
  });
  const role = resolveRole(user, roleQuery);

  return <DashboardSectionContent role={role} section="dashboard" />;
}
