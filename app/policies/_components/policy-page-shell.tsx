"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ChevronRight, Home } from "lucide-react";
import Footer from "@/app/components/ui/Footer";
import { ContactModal } from "@/app/components/ui/contact-modal";
import { PolicyDocumentBody, PolicyDocumentHero } from "@/app/components/policies/policy-document-view";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import type { PolicyDocument } from "@/data/policies/types";
import type { AuthUser } from "@/lib/mock-auth";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";

type PolicyPageShellProps = {
  doc: PolicyDocument;
  relatedPolicies: Array<{ slug: string; label: string; eyebrow: string }>;
};

export function PolicyPageShell({ doc, relatedPolicies }: PolicyPageShellProps) {
  const router = useRouter();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const user = useSyncExternalStore<AuthUser | null>(subscribeAuthStore, readAuthSnapshot, () => null);

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-sky-50/40 text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100">
      <LandingHeader
        user={user}
        onAuthClick={() => router.push("/?auth=login")}
        onDashboardClick={() => router.push("/dashboard")}
        onContactClick={() => setIsContactModalOpen(true)}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Link href="/" className="inline-flex items-center gap-1.5 transition hover:text-sky-600 dark:hover:text-sky-400">
            <Home className="h-4 w-4" />
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium text-slate-700 dark:text-slate-200">Policies</span>
          <ChevronRight className="h-4 w-4" />
          <span className="font-semibold text-slate-900 dark:text-slate-100">{doc.title}</span>
        </nav>

        <section className="space-y-6">
          <PolicyDocumentHero doc={doc} />
          <PolicyDocumentBody doc={doc} relatedPolicies={relatedPolicies} />
        </section>
      </main>

      <Footer />
      <ContactModal open={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}
