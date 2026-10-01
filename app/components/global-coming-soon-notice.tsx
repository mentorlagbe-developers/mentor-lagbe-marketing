"use client";

import { useSearchParams } from "next/navigation";
import { ComingSoonBanner } from "@/app/sections/landing/coming-soon-banner";
import { isComingSoonMode } from "@/lib/coming-soon";

export function GlobalComingSoonNotice() {
  const searchParams = useSearchParams();
  const comingSoon = isComingSoonMode();
  const showNotice =
    comingSoon || searchParams.get("notice") === "coming-soon";

  if (!showNotice) return null;

  return <ComingSoonBanner />;
}
