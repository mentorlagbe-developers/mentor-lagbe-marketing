"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CircleHelp, ScrollText, Settings } from "lucide-react";
import { getDashboardMenuByRole } from "@/app/dashboard/dashboard-menu";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/mock-auth";

type DashboardSidebarProps = {
  role: UserRole;
  collapsed: boolean;
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

const SUPPORT_IDS = new Set(["help-center", "privacy-policies", "platform-settings"]);

export function DashboardSidebar({
  role,
  collapsed,
  mobileOpen = false,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const menus = getDashboardMenuByRole(role);
  const primaryMenus = menus.filter((item) => !SUPPORT_IDS.has(item.id));
  const supportMenus = menus.filter((item) => SUPPORT_IDS.has(item.id));
  const showExpanded = mobileOpen || !collapsed;
  const widthClass = showExpanded ? "w-65" : "w-22";
  const panelClass = "bg-linear-to-b from-sky-900 via-blue-900 to-cyan-900";
  const helpCenter = supportMenus.find((item) => item.id === "help-center");
  const privacyMenu = supportMenus.find((item) => item.id === "privacy-policies");
  const settingsMenu = supportMenus.find((item) => item.id === "platform-settings");
  const helpActive = Boolean(helpCenter && pathname === helpCenter.href);
  const privacyActive = Boolean(privacyMenu && pathname === privacyMenu.href);
  const settingsActive = Boolean(settingsMenu && pathname === settingsMenu.href);

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-slate-700 p-4 text-slate-100 transition-all duration-300 lg:sticky lg:top-0 lg:translate-x-0",
        widthClass,
        panelClass,
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
    >
      {showExpanded ? (
        <div className="mb-4 flex justify-center">
          <Link
            href="/"
            onClick={onNavigate}
            className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white p-1.5 shadow-sm transition hover:scale-[1.03]"
          >
            <Image
              src="/images/logo-3.png"
              alt="Mentor Lagbe logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
          </Link>
        </div>
      ) : null}

      {showExpanded ? (
        <div className="mb-6 space-y-1">
          <p className="text-xs uppercase tracking-[0.22em] text-sky-200/70">Portal</p>
          <h2 className="text-lg font-semibold capitalize">{role} Dashboard</h2>
        </div>
      ) : null}

      <p className={cn("mb-3 text-xs uppercase tracking-[0.2em] text-sky-200/70", !showExpanded && "text-center")}>
        Menu
      </p>
      <nav className="space-y-2">
        {primaryMenus.map((menu) => {
          const Icon = menu.icon;
          const active = pathname === menu.href;

          return (
            <Link
              key={menu.id}
              href={menu.href}
              onClick={onNavigate}
              className={cn(
                "group flex rounded-xl border px-3 py-2 transition",
                active
                  ? "border-cyan-300/40 bg-white/13 text-white"
                  : "border-transparent text-slate-200/85 hover:border-white/15 hover:bg-white/10 hover:text-white",
                !showExpanded ? "justify-center" : "items-center gap-2.5",
              )}
              title={!showExpanded ? menu.label : undefined}
            >
              <span
                className={cn(
                  "rounded-lg p-1.5 transition",
                  active ? "bg-cyan-400/20 text-cyan-100" : "bg-white/10 text-sky-100",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {showExpanded ? <span className="min-w-0 text-sm font-semibold">{menu.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8">
        <p
          className={cn(
            "mb-3 text-xs uppercase tracking-[0.2em] text-sky-200/70",
            !showExpanded && "text-center text-[10px]",
          )}
        >
          Support
        </p>
        <div className="space-y-2">
          {showExpanded ? (
            <>
              {helpCenter ? (
                <Link
                  href={helpCenter.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-slate-200/90 transition hover:border-white/15 hover:bg-white/10 hover:text-white",
                    helpActive ? "border-cyan-300/40 bg-white/13 text-white" : "border-transparent",
                  )}
                >
                  <span className="rounded-lg bg-white/10 p-1.5">
                    <CircleHelp className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">Help Center</span>
                </Link>
              ) : null}
              {privacyMenu ? (
                <Link
                  href={privacyMenu.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2 text-slate-200/90 transition hover:border-white/15 hover:bg-white/10 hover:text-white",
                    privacyActive ? "border-cyan-300/40 bg-white/13 text-white" : "border-transparent",
                  )}
                >
                  <span className="rounded-lg bg-white/10 p-1.5">
                    <ScrollText className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">Privacy & Policies</span>
                </Link>
              ) : null}
              {settingsMenu ? (
                <Link
                  href={settingsMenu.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2 text-slate-200/90 transition hover:border-white/15 hover:bg-white/10 hover:text-white",
                    settingsActive ? "border-cyan-300/40 bg-white/13 text-white" : "border-transparent",
                  )}
                >
                  <span className="rounded-lg bg-white/10 p-1.5">
                    <Settings className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">{settingsMenu.label}</span>
                </Link>
              ) : null}
            </>
          ) : (
            <>
              {helpCenter ? (
                <Link
                  href={helpCenter.href}
                  onClick={onNavigate}
                  className="flex w-full items-center justify-center rounded-xl bg-white/10 p-2.5 transition hover:bg-white/20"
                  title="Help Center"
                >
                  <CircleHelp className="h-4 w-4" />
                </Link>
              ) : null}
              {privacyMenu ? (
                <Link
                  href={privacyMenu.href}
                  onClick={onNavigate}
                  className="flex w-full items-center justify-center rounded-xl bg-white/10 p-2.5 transition hover:bg-white/20"
                  title="Privacy & Policies"
                >
                  <ScrollText className="h-4 w-4" />
                </Link>
              ) : null}
              {settingsMenu ? (
                <Link
                  href={settingsMenu.href}
                  onClick={onNavigate}
                  className="flex w-full items-center justify-center rounded-xl bg-white/10 p-2.5 transition hover:bg-white/20"
                  title={settingsMenu.label}
                >
                  <Settings className="h-4 w-4" />
                </Link>
              ) : null}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
