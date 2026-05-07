"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarPlus2, ChevronDown, Globe, LogOut, Menu, MoonStar, Settings, Sun, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { NotificationDropdown } from "@/app/dashboard/_components/notification-dropdown";
import { getDashboardMenuByRole } from "@/app/dashboard/dashboard-menu";
import { Button } from "@/app/components/ui/button";
import type { AuthUser, UserRole } from "@/lib/mock-auth";
import { useAuth } from "@/lib/use-auth";

type DashboardHeaderProps = {
  user: AuthUser;
  role: UserRole;
  collapsed: boolean;
  onToggleSidebar: () => void;
  onLogout: () => void;
};

const languages = [
  { id: "en", label: "English", icon: "🇬🇧" },
  { id: "bn", label: "Bangla", icon: "🇧🇩" },
] as const;

export function DashboardHeader({
  user,
  role,
  collapsed,
  onToggleSidebar,
  onLogout,
}: DashboardHeaderProps) {
  const router = useRouter();
  const auth = useAuth();
  const [roleQuery] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }
    const query = new URLSearchParams(window.location.search);
    return query.get("role");
  });
  const [language, setLanguage] = useState<(typeof languages)[number]["id"]>("en");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.localStorage.getItem("mentorlagbe-theme") === "dark" ? "dark" : "light";
  });
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  const initials = useMemo(
    () =>
      user.fullName
        .split(" ")
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("") || "U",
    [user.fullName]
  );
  const hasRealUser = user.id !== "preview-user";
  const userName = hasRealUser ? user.fullName : "User";
  const userId = hasRealUser ? (user.readableId?.trim() || "N/A") : "N/A";
  const avatarDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><rect width='100%' height='100%' fill='#dbeafe'/><text x='50%' y='53%' dominant-baseline='middle' text-anchor='middle' font-family='Arial' font-size='28' fill='#1e3a8a' font-weight='700'>${initials}</text></svg>`
  )}`;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("mentorlagbe-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onWindowClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (languageRef.current && !languageRef.current.contains(target)) {
        setIsLanguageOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false);
      }
    };

    window.addEventListener("mousedown", onWindowClick);
    return () => window.removeEventListener("mousedown", onWindowClick);
  }, []);

  function withRoleQuery(path: string) {
    return roleQuery ? `${path}?role=${roleQuery}` : path;
  }

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  }

  const settingsHref = withRoleQuery(
    getDashboardMenuByRole(role).some((item) => item.id === "platform-settings")
      ? "/dashboard/platform-settings"
      : "/dashboard/overview"
  );

  return (
    <>
      <header className="sticky top-0 z-20 flex h-15 items-center justify-between border-b border-white/40 bg-white/35 px-5 shadow-[0_18px_32px_-24px_rgba(15,23,42,0.65),0_2px_10px_-6px_rgba(30,64,175,0.4)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/30 dark:shadow-[0_18px_30px_-22px_rgba(2,6,23,0.9)]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200/80 bg-white/80 text-slate-700 transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div className="leading-tight">
            <h1
              className={`text-sm font-semibold transition-colors ${
                isScrolled ? "text-slate-900 dark:text-slate-100" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              Welcome {userName}
            </h1>
            <div className="mt-0.5 flex items-center gap-4">
              <p
                className={`text-xs transition-colors ${
                  isScrolled ? "text-slate-500 dark:text-slate-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                Role: {role}
              </p>
              <p
                className={`text-xs transition-colors ${
                  isScrolled ? "text-slate-500 dark:text-slate-400" : "text-slate-500 dark:text-slate-400"
                }`}
              >
                ID: {userId}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            iconLeft={CalendarPlus2}
            onClick={() => router.push(withRoleQuery("/dashboard/live-session-book"))}
          >
            Book Live Session
          </Button>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>

          <div className="relative" ref={languageRef}>
            <button
              type="button"
              onClick={() => setIsLanguageOpen((state) => !state)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Globe className="h-4 w-4 text-slate-500 dark:text-slate-300" />
              <span>{language.toUpperCase()}</span>
              <ChevronDown className={`h-4 w-4 transition ${isLanguageOpen ? "rotate-180" : ""}`} />
            </button>
            {isLanguageOpen ? (
              <div className="absolute right-0 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800">
                {languages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLanguage(item.id);
                      setIsLanguageOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                      language === item.id
                        ? "bg-sky-50 text-sky-600 dark:bg-slate-700 dark:text-sky-300"
                        : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setIsNotificationOpen((state) => !state)}
              className="relative rounded-lg border border-brand-primary bg-white p-1.5 text-slate-600 transition hover:bg-sky-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label="Open notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                3
              </span>
            </button>
            {isNotificationOpen ? <NotificationDropdown /> : null}
          </div>

          <button
            type="button"
            onClick={() => router.push(settingsHref)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            aria-label="Open settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setIsProfileOpen((state) => !state)}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-1 transition hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <div className="relative shrink-0">
                {hasRealUser ? (
                  <Image
                    src={avatarDataUri}
                    alt={userName}
                    width={36}
                    height={36}
                    unoptimized
                    className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-emerald-100 to-sky-100 text-xs font-semibold text-slate-700 dark:from-slate-600 dark:to-slate-500 dark:text-white">
                    {initials}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-white bg-emerald-500 dark:border-slate-800" />
              </div>
              <ChevronDown className={`h-4 w-4 text-slate-500 transition ${isProfileOpen ? "rotate-180" : ""}`} />
            </button>

            {isProfileOpen ? (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center gap-3 bg-brand-primary px-4 py-3 text-white">
                  <div className="relative shrink-0">
                    {hasRealUser ? (
                      <Image
                        src={avatarDataUri}
                        alt={userName}
                        width={48}
                        height={48}
                        unoptimized
                        className="h-12 w-12 shrink-0 rounded-full border-2 border-white/70 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-700">
                        {initials}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#184f51] bg-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold">{userName}</p>
                    <p
                      className="truncate text-sm text-slate-200"
                      title={hasRealUser ? user.email : "—"}
                    >
                      {hasRealUser ? user.email : "—"}
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-sky-50 hover:text-brand-primary dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <UserCircle2 className="h-4 w-4" />
                  My Profile
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-sky-50 hover:text-brand-primary dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Change Password
                </button>
                <button
                  type="button"
                  onClick={() => router.push(settingsHref)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-sky-50 hover:text-brand-primary dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                </div>
                <div className="border-t border-slate-200 px-2 py-1.5 dark:border-slate-700">
                <button
                  type="button"
                  onClick={async () => {
                    await auth.logout();
                    onLogout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-sky-50 dark:hover:bg-slate-700"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
