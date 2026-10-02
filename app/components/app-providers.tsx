"use client";

import { Suspense } from "react";
import { AppLoadIndicator } from "@/app/components/app-load-indicator";
import { GlobalComingSoonNotice } from "@/app/components/global-coming-soon-notice";
import { LocaleProvider } from "@/lib/locale/locale-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <AppLoadIndicator />
      <Suspense fallback={null}>
        <GlobalComingSoonNotice />
      </Suspense>
      {children}
    </LocaleProvider>
  );
}
