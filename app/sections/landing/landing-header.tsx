"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, MoonStar, Sun, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { LanguageSwitcher } from "@/app/components/ui/language-switcher";
import { SearchIcon } from "@/app/components/ui/icons";
import { Logo } from "@/app/components/ui/logo";
import type { AuthUser } from "@/lib/mock-auth";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";
import { cn } from "@/lib/utils";

type LandingHeaderProps = {
  user: AuthUser | null;
  comingSoon?: boolean;
  onAuthClick: () => void;
  onDashboardClick: () => void;
  onContactClick: () => void;
  onLearnNowClick?: () => void;
};

const navItems: Array<{ labelKey: MessageKey; href: string; isAction?: boolean }> = [
  { labelKey: "nav.home", href: "/" },
  { labelKey: "nav.about", href: "/about" },
  { labelKey: "nav.contact", href: "#", isAction: true },
];

export function LandingHeader({
  user,
  comingSoon = false,
  onAuthClick,
  onDashboardClick,
  onContactClick,
}: LandingHeaderProps) {
  const t = useT();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    return window.localStorage.getItem("mentorlagbe-theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("mentorlagbe-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleContact() {
    closeMobileMenu();
    onContactClick();
  }

  function handleAuth() {
    closeMobileMenu();
    onAuthClick();
  }

  function handleDashboard() {
    closeMobileMenu();
    onDashboardClick();
  }

  const navLinkClass =
    "block w-full rounded-xl px-4 py-3 text-left text-base font-medium text-slate-700 transition hover:bg-sky-50 dark:text-slate-200 dark:hover:bg-slate-800";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b shadow-[0_10px_24px_-18px_rgba(15,23,42,0.38)] backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-300",
        isScrolled
          ? "border-slate-200/80 bg-white/95 shadow-md dark:border-slate-700/80 dark:bg-slate-900/95"
          : "border-white/30 bg-white/80 dark:border-slate-700/70 dark:bg-slate-900/80"
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-4 lg:px-8">
        <Logo isDark={theme === "dark"} />

        <nav className="hidden items-center gap-6 pl-3 lg:flex" aria-label="Main">
          {navItems.map((item) =>
            item.isAction ? (
              <button
                key={item.labelKey}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  onContactClick();
                }}
                className="group relative text-base font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
              >
                {t(item.labelKey)}
                <span className="pointer-events-none absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 rounded bg-sky-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </button>
            ) : (
              <Link
                key={item.labelKey}
                href={item.href}
                className="group relative text-base font-medium text-slate-700 transition hover:text-slate-950 dark:text-slate-200 dark:hover:text-white"
              >
                {t(item.labelKey)}
                <span className="pointer-events-none absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 rounded bg-sky-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            )
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="relative hidden lg:block">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <input
              type="search"
              placeholder={t("header.searchPlaceholder")}
              className="h-10 w-36 rounded-xl border border-blue-500/40 bg-white/65 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 xl:w-52"
            />
          </div>

          <button
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/55 bg-white/65 text-slate-700 transition hover:bg-white/85 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>

          <LanguageSwitcher />

          {!comingSoon ? (
            user ? (
              <Button size="sm" onClick={onDashboardClick}>
                {t("nav.dashboard")}
              </Button>
            ) : (
              <Button size="sm" onClick={onAuthClick}>
                {t("nav.login")}
              </Button>
            )
          ) : null}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/55 bg-white/65 text-slate-700 transition hover:bg-white/85 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <MoonStar className="h-4.5 w-4.5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/55 bg-white/65 text-slate-700 transition hover:bg-white/85 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
            aria-expanded={isMobileMenuOpen}
            aria-controls="landing-mobile-nav"
            aria-label={isMobileMenuOpen ? t("header.menuClose") : t("header.menuOpen")}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            aria-label={t("header.menuClose")}
            onClick={closeMobileMenu}
          />
          <nav
            id="landing-mobile-nav"
            className={cn(
              "fixed inset-x-0 top-[57px] z-50 max-h-[calc(100dvh-57px)] overflow-y-auto border-b border-slate-200 bg-white/98 px-4 py-4 shadow-lg dark:border-slate-700 dark:bg-slate-900/98 md:hidden"
            )}
            aria-label="Main"
          >
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {navItems.map((item) =>
                item.isAction ? (
                  <button key={item.labelKey} type="button" onClick={handleContact} className={navLinkClass}>
                    {t(item.labelKey)}
                  </button>
                ) : (
                  <Link key={item.labelKey} href={item.href} onClick={closeMobileMenu} className={navLinkClass}>
                    {t(item.labelKey)}
                  </Link>
                )
              )}

              <div className="relative mt-2">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="search"
                  placeholder={t("header.searchPlaceholder")}
                  className="h-11 w-full rounded-xl border border-blue-500/40 bg-white/65 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              {!comingSoon ? (
                <div className="mt-2 pt-2">
                  {user ? (
                    <Button size="md" className="w-full" onClick={handleDashboard}>
                      {t("nav.dashboard")}
                    </Button>
                  ) : (
                    <Button size="md" className="w-full" onClick={handleAuth}>
                      {t("nav.login")}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
