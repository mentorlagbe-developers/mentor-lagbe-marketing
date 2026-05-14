"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/app/dashboard/_components/dashboard-header";
import { DashboardFooter } from "@/app/dashboard/_components/dashboard-footer";
import { DashboardSidebar } from "@/app/dashboard/_components/dashboard-sidebar";
import { ProfileCompletionBanner } from "@/app/dashboard/_components/profile/profile-completion-banner";
import { ProfileStatusProvider } from "@/app/dashboard/_components/profile-status-context";
import { WhatsAppChatWidget } from "@/app/dashboard/_components/whatsapp-chat-widget";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import type { AuthUser } from "@/lib/mock-auth";
import { useAuth } from "@/lib/use-auth";
import { NotificationsProvider } from "@/lib/notifications-context";

type DashboardShellProps = { children: React.ReactNode };

export function DashboardShell({ children }: DashboardShellProps) {
  const router = useRouter();
  const { isHydrating } = useAuth();
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);
  const activeRole = user?.role ?? "student";
  useEffect(() => {
    if (!isHydrating && !user) {
      router.replace("/?auth=login");
    }
  }, [isHydrating, router, user]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  if (isHydrating || !user) {
    return <div className="p-6 text-sm text-slate-500">Loading dashboard...</div>;
  }

  return (
    <NotificationsProvider>
      <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <DashboardSidebar role={activeRole} collapsed={isSidebarCollapsed} />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <ProfileStatusProvider role={activeRole}>
            <DashboardHeader
              role={activeRole}
              user={user}
              collapsed={isSidebarCollapsed}
              onToggleSidebar={() => setIsSidebarCollapsed((state) => !state)}
              onLogout={() => router.push("/?auth=login")}
            />
            <ProfileCompletionBanner />
            <main className="flex-1 p-6">{children}</main>
            <DashboardFooter />
          </ProfileStatusProvider>
        </div>
        <WhatsAppChatWidget />
      </div>
    </NotificationsProvider>
  );
}
