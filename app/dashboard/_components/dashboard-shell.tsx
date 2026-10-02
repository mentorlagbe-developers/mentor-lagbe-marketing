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
import { cn } from "@/lib/utils";

type DashboardShellProps = { children: React.ReactNode };

function isMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 1023px)").matches;
}

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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileNavOpen]);

  useEffect(() => {
    const onResize = () => {
      if (!isMobileViewport()) {
        setIsMobileNavOpen(false);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleToggleSidebar() {
    if (isMobileViewport()) {
      setIsMobileNavOpen((open) => !open);
      return;
    }
    setIsSidebarCollapsed((state) => !state);
  }

  if (isHydrating || !user) {
    return <div className="p-6 text-sm text-slate-500">Loading dashboard...</div>;
  }

  return (
    <NotificationsProvider role={activeRole}>
      <div className="flex min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <button
          type="button"
          className={cn(
            "fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 ease-out lg:hidden",
            isMobileNavOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          )}
          aria-label="Close navigation"
          aria-hidden={!isMobileNavOpen}
          tabIndex={isMobileNavOpen ? 0 : -1}
          onClick={() => setIsMobileNavOpen(false)}
        />
        <DashboardSidebar
          role={activeRole}
          collapsed={isSidebarCollapsed}
          mobileOpen={isMobileNavOpen}
          onNavigate={() => setIsMobileNavOpen(false)}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <ProfileStatusProvider role={activeRole}>
            <DashboardHeader
              role={activeRole}
              user={user}
              collapsed={isSidebarCollapsed}
              onToggleSidebar={handleToggleSidebar}
              onLogout={() => router.push("/?auth=login")}
            />
            <ProfileCompletionBanner />
            <main className="flex-1 p-4 sm:p-6">{children}</main>
            <DashboardFooter />
          </ProfileStatusProvider>
        </div>
        <WhatsAppChatWidget />
      </div>
    </NotificationsProvider>
  );
}
