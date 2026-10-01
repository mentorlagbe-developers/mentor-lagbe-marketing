"use client";

import { useT } from "@/lib/locale/locale-provider";

export function ComingSoonBanner() {
  const t = useT();

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-sky-700/40 bg-linear-to-r from-sky-600 via-sky-500 to-cyan-600 px-4 py-3 text-center shadow-md shadow-sky-900/20 sm:px-5 sm:py-3.5"
    >
      <p className="mx-auto inline-block max-w-full px-1 text-xs font-medium leading-snug text-white sm:text-sm lg:whitespace-nowrap lg:text-[0.9375rem]">
        <span className="font-bold tracking-tight">{t("banner.title")}</span>
        <span aria-hidden="true"> — </span>
        <span>{t("banner.body")}</span>
      </p>
    </div>
  );
}
