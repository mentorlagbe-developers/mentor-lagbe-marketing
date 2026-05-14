"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, CalendarPlus2, ChevronDown, Globe, Lock, LogOut, Menu, MoonStar, Settings, Star, Sun, TrendingUp, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { NotificationDropdown } from "@/app/dashboard/_components/notification-dropdown";
import { useProfileStatus } from "@/app/dashboard/_components/profile-status-context";
import { Button } from "@/app/components/ui/button";
import type { AuthUser, UserRole } from "@/lib/mock-auth";
import { useAuth } from "@/lib/use-auth";
import { useNotifications } from "@/lib/notifications-context";

// ─── Mentor stats pill (rating + sessions) ────────────────────
function MentorStatsPill({
  rating,
  totalSessions,
}: {
  rating: number;
  totalSessions: number;
}) {
  const [showNudge, setShowNudge] = useState(false);
  const isNew = rating === 0 && totalSessions === 0;

  // Auto-show nudge tooltip on mount for new mentors, then hide after 6 s
  useEffect(() => {
    if (!isNew) return;
    const show = setTimeout(() => setShowNudge(true), 800);
    const hide = setTimeout(() => setShowNudge(false), 6800);
    return () => {
      clearTimeout(show);
      clearTimeout(hide);
    };
  }, [isNew]);

  const clamped = Math.min(5, Math.max(0, rating));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75;
  const empty = 5 - full - (hasHalf ? 1 : 0);

  return (
    <div className="relative flex items-center gap-2">
      {/* Rating stars */}
      <div
        className="flex items-center gap-1"
        onMouseEnter={() => isNew && setShowNudge(true)}
        onMouseLeave={() => isNew && setShowNudge(false)}
      >
        <div className="flex items-center gap-0.5">
          {Array.from({ length: full }).map((_, i) => (
            <Star key={`f${i}`} className="h-3 w-3 fill-amber-400 text-amber-400" />
          ))}
          {hasHalf && (
            <span className="relative inline-flex h-3 w-3">
              <Star className="absolute h-3 w-3 text-slate-300 dark:text-slate-600" />
              <span className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              </span>
            </span>
          )}
          {Array.from({ length: empty }).map((_, i) => (
            <Star key={`e${i}`} className="h-3 w-3 text-slate-300 dark:text-slate-600" />
          ))}
        </div>
        <span className={`text-xs font-semibold ${isNew ? "text-slate-400 dark:text-slate-500" : "text-amber-500"}`}>
          {isNew ? "0.0" : clamped.toFixed(1)}/5
        </span>
      </div>

      {/* Session count */}
      <span className="hidden h-3 w-px bg-slate-300 dark:bg-slate-600 sm:block" aria-hidden />
      <div className="hidden items-center gap-1 sm:flex">
        <TrendingUp className="h-3 w-3 text-sky-500" />
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {totalSessions} session{totalSessions !== 1 ? "s" : ""}
        </span>
      </div>

      {/* New-mentor nudge tooltip */}
      {isNew && showNudge && (
        <div
          className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-sky-200 bg-white p-3 shadow-xl shadow-sky-100/60 dark:border-sky-800/40 dark:bg-slate-800 dark:shadow-slate-900/60"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Start your mentorship journey!
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                Accept sessions, deliver great guidance, and your rating will build naturally. Your first session is the first step.
              </p>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 rounded-sm border-l border-t border-sky-200 bg-white dark:border-sky-800/40 dark:bg-slate-800" />
        </div>
      )}
    </div>
  );
}

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

const avatarPalette = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-fuchsia-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
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
  const { needsCompletionForLiveSession, profile } = useProfileStatus();
  const { unreadCount } = useNotifications();

  const mentorStats = useMemo(() => {
    if (role !== "teacher") return null;
    const mp = profile?.mentorProfile as unknown as Record<string, unknown> | null | undefined;
    const top = profile as unknown as Record<string, unknown> | null | undefined;
    const r = mp?.rating ?? mp?.averageRating ?? top?.rating ?? top?.averageRating;
    const rating = typeof r === "number" ? r : 0;
    const s =
      mp?.totalSessions ?? mp?.sessionCount ?? mp?.completedSessions ??
      top?.totalSessions ?? top?.sessionCount ?? top?.completedSessions;
    const totalSessions = typeof s === "number" ? s : 0;
    return { rating, totalSessions };
  }, [profile, role]);
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
  const avatarIndex = useMemo(
    () =>
      Array.from(user.fullName || "User").reduce((acc, char) => acc + char.charCodeAt(0), 0) %
      avatarPalette.length,
    [user.fullName]
  );
  const avatarGradient = avatarPalette[avatarIndex];
  const profileImageUrl =
    hasRealUser &&
    (profile?.profilePictureUrl?.trim() ||
      user.profilePictureUrl?.trim() ||
      null);

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

  const settingsHref = withRoleQuery("/dashboard/platform-settings");

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
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Welcome {userName}
            </h1>
            <div className="mt-0.5 flex flex-wrap items-center gap-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Role: {role}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ID: {userId}
              </p>
              {mentorStats !== null && (
                <MentorStatsPill
                  rating={mentorStats.rating}
                  totalSessions={mentorStats.totalSessions}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {role !== "teacher" && (
            <Button
              size="sm"
              iconLeft={CalendarPlus2}
              disabled={needsCompletionForLiveSession}
              onClick={() => router.push(withRoleQuery("/dashboard/live-session-book"))}
              className="disabled:cursor-not-allowed disabled:opacity-60"
            >
              Book Live Session
            </Button>
          )}

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
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
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
                  profileImageUrl ? (
                    <Image
                      src={profileImageUrl}
                      alt={userName}
                      width={36}
                      height={36}
                      unoptimized
                      className="h-9 w-9 shrink-0 rounded-full border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${avatarGradient} text-sm font-semibold text-white`}>
                      {initials.slice(0, 1)}
                    </div>
                  )
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
                      profileImageUrl ? (
                        <Image
                          src={profileImageUrl}
                          alt={userName}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 shrink-0 rounded-full border-2 border-white/70 object-cover"
                        />
                      ) : (
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${avatarGradient} text-lg font-semibold text-white`}>
                          {initials.slice(0, 1)}
                        </div>
                      )
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
                  onClick={() => router.push(withRoleQuery("/dashboard/profile"))}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-sky-50 hover:text-brand-primary dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <UserCircle2 className="h-4 w-4" />
                  My Profile
                </button>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-sky-50 hover:text-brand-primary dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Lock className="h-4 w-4" />
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
