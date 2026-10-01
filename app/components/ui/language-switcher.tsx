"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, GlobeIcon } from "@/app/components/ui/icons";
import { useLocale } from "@/lib/locale/locale-provider";
import type { Locale } from "@/lib/locale/types";

const languages: Array<{ id: Locale; labelKey: "lang.english" | "lang.bangla"; icon: string }> = [
  { id: "en", labelKey: "lang.english", icon: "🇬🇧" },
  { id: "bn", labelKey: "lang.bangla", icon: "🇧🇩" },
];

type LanguageSwitcherProps = {
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const active = languages.find((item) => item.id === locale) ?? languages[0];

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    window.addEventListener("mousedown", onClickOutside);
    return () => window.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-xl border border-white/55 bg-white/65 px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-white/85 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
            : "inline-flex items-center gap-2 rounded-xl border border-white/55 bg-white/65 px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-white/85 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-700"
        }
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <GlobeIcon className="h-4 w-4 text-slate-500 dark:text-slate-300" />
        <span>{t(active.labelKey)}</span>
        <ChevronDownIcon
          className={`h-4 w-4 text-slate-500 transition dark:text-slate-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white/95 p-1 shadow-lg backdrop-blur-xl dark:border-slate-700 dark:bg-slate-800/95"
        >
          {languages.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={locale === item.id}
              onClick={() => {
                setLocale(item.id);
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                locale === item.id
                  ? "bg-sky-50 text-sky-600 dark:bg-slate-700 dark:text-sky-300"
                  : "text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              <span className="inline-flex min-w-8 justify-center rounded-md bg-slate-100 px-1.5 py-0.5 text-sm dark:bg-slate-600">
                {item.icon}
              </span>
              <span>{t(item.labelKey)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
