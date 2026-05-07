"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { DashboardFooter } from "@/app/dashboard/_components/dashboard-footer";
import { DashboardSidebar } from "@/app/dashboard/_components/dashboard-sidebar";
import { WhatsAppChatWidget } from "@/app/dashboard/_components/whatsapp-chat-widget";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import type { AuthUser, UserRole } from "@/lib/mock-auth";

type DashboardShellProps = {
  children: React.ReactNode;
};

function resolveRole(user: AuthUser): UserRole {
  return user.role ?? "student";
}

function resolvePreviewRole(role: string | null): UserRole {
  if (role === "teacher" || role === "admin" || role === "superadmin") {
    return role;
  }
  return "student";
}

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const previewRole = resolvePreviewRole(searchParams.get("role"));
  const activeRole = user ? resolveRole(user) : previewRole;

  // Temporary auth guard disabled for dashboard UI design preview.
  /*
  useEffect(() => {
    if (!getCurrentUser()) {
      router.replace("/");
    }
  }, [router, user]);
  */

  const previewUser: AuthUser = {
    id: "preview-user",
    fullName: "Design Preview User",
    email: "preview@mentorlagbe.com",
    age: 0,
    gender: "other",
    phone: "+8800000000000",
    verifiedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    avatarSeed: "DP",
    role: activeRole,
  };
  const activeUser = user ?? previewUser;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <DashboardSidebar role={activeRole} collapsed={isSidebarCollapsed} />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <DashboardHeader
          role={activeRole}
          user={activeUser}
          collapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((state) => !state)}
          onLogout={() => router.push("/")}
        />
        <main className="flex-1 p-6">{children}</main>
        <DashboardFooter />
      </div>
      <WhatsAppChatWidget />
    </div>
  );
}
