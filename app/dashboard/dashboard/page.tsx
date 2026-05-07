"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { DashboardSectionContent } from "@/app/dashboard/_components/dashboard-section-content";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import type { AuthUser } from "@/lib/mock-auth";
import { useAuth } from "@/lib/use-auth";

export default function DashboardStaticPage() {
  const router = useRouter();
  const { isHydrating } = useAuth();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const role = user?.role ?? "student";

  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/?auth=login");
    }
  }, [isHydrating, router, user]);

  if (isHydrating || !user) {
    return <div className="p-6 text-sm text-slate-500">Loading dashboard...</div>;
  }

  return <DashboardSectionContent role={role} section="dashboard" />;
}
