"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { translate, type MessageKey } from "@/lib/locale/messages";
import { LOCALE_STORAGE_KEY, type Locale } from "@/lib/locale/types";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "bn" ? "bn" : "en";
}

let localeSnapshot: Locale =
  typeof window !== "undefined" ? readStoredLocale() : "en";
const listeners = new Set<() => void>();

function subscribeLocale(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitLocale() {
  listeners.forEach((l) => l());
}

function setGlobalLocale(next: Locale) {
  localeSnapshot = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next === "bn" ? "bn" : "en";
  }
  emitLocale();
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStoredLocale();
    localeSnapshot = stored;
    document.documentElement.lang = stored === "bn" ? "bn" : "en";
    setHydrated(true);
    emitLocale();
  }, []);

  const locale = useSyncExternalStore<Locale>(
    subscribeLocale,
    () => localeSnapshot,
    (): Locale => "en"
  );

  const setLocale = useCallback((next: Locale) => {
    setGlobalLocale(next);
  }, []);

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  if (!hydrated) {
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
  }

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

export function useT() {
  return useLocale().t;
}
