"use client";

import Link from "next/link";
import { useState } from "react";
import { ContactModal } from "@/app/components/ui/contact-modal";
import { getAccessToken } from "@/lib/auth-store";

export function DashboardFooter() {
  const [isContactOpen, setIsContactOpen] = useState(false);

  function handleSupportClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (getAccessToken()) {
      return;
    }
    event.preventDefault();
    setIsContactOpen(true);
  }

  return (
    <>
      <footer className="mt-8 flex items-center justify-between border-t border-slate-200/80 px-6 py-3 text-xs text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
        <p>© {new Date().getFullYear()} Mentor Lagbe</p>
        <div className="flex items-center gap-4">
          <Link href="/about" className="transition hover:text-brand-primary">
            About
          </Link>
          <Link
            href="/dashboard/help-center"
            onClick={handleSupportClick}
            className="transition hover:text-brand-primary"
          >
            Support
          </Link>
        </div>
      </footer>
      <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
