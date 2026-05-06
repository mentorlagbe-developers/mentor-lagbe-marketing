"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  BellIcon,
  ChevronDownIcon,
  GlobeIcon,
  SearchIcon,
} from "@/app/components/ui/icons";
import { Logo } from "@/app/components/ui/logo";
import type { AuthUser } from "@/lib/mock-auth";

type LandingHeaderProps = {
  user: AuthUser | null;
  onSignupClick: () => void;
  onLogoutClick: () => void;
};

const navItems = [
  "Home",
  "Courses",
  "Live Sessions",
  "Teachers",
  "About",
  "Contact",
];

export function LandingHeader({
  user,
  onSignupClick,
  onLogoutClick,
}: LandingHeaderProps) {
  const [language, setLanguage] = useState<"en" | "bn">("en");
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const languageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!languageRef.current) {
        return;
      }

      if (!languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  const initials =
    user?.avatarSeed ||
    user?.fullName
      .split(" ")
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") ||
    "ML";

  const languages = [
    { id: "en", label: "English", icon: "🇬🇧" },
    { id: "bn", label: "Bangla", icon: "🇧🇩" },
  ] as const;

  const activeLanguage =
    languages.find((item) => item.id === language) ?? languages[0];

  return (
    <header className="sticky top-0 z-30 border-b border-white/30 bg-white/35 shadow-[0_10px_24px_-18px_rgba(15,23,42,0.38)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-6 pl-3 lg:flex">
          {navItems.map((item) => (
            <a
              key={item}
              href="#"
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 md:flex">
          <div className="relative hidden lg:block">
            <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search courses..."
              className="h-10 w-36 rounded-xl border border-blue-500/40 bg-white/65 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 xl:w-52"
            />
          </div>

          <div className="relative" ref={languageRef}>
            <button
              type="button"
              onClick={() => setIsLanguageOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/55 bg-white/65 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/85"
            >
              <GlobeIcon className="h-4 w-4 text-slate-500" />
              <span>{activeLanguage.label}</span>
              <ChevronDownIcon
                className={`h-4 w-4 text-slate-500 transition ${isLanguageOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isLanguageOpen ? (
              <div className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur-xl">
                {languages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setLanguage(item.id);
                      setIsLanguageOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      language === item.id
                        ? "bg-sky-50 text-sky-600"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className="inline-flex min-w-8 justify-center rounded-md bg-slate-100 px-1.5 py-0.5 text-sm">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                aria-label="Notifications"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>

              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f1d1c0,#c98b73)] text-sm font-bold text-white shadow-sm">
                  {initials}
                </span>
                <div className="hidden xl:block">
                  <p className="text-sm font-semibold text-slate-800">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-500">Student</p>
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={onLogoutClick}>
                Logout
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onSignupClick}>
              Sign Up
            </Button>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 md:hidden">
          {!user ? (
            <Button size="sm" onClick={onSignupClick}>
              Sign Up
            </Button>
          ) : (
            <button
              type="button"
              onClick={onLogoutClick}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#f1d1c0,#c98b73)] text-sm font-bold text-white"
              aria-label="Logout"
            >
              {initials}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
