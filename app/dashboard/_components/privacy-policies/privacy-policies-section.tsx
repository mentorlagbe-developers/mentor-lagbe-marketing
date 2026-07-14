"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpenCheck, FileText, ListTree, ScrollText, Shield } from "lucide-react";
import {
  getPrivacyPolicyForRole,
  type PolicyBlock,
  type PolicySection,
  type RolePolicyDocument,
} from "@/lib/dashboard-privacy-policies";
import type { UserRole } from "@/lib/mock-auth";
import { cn } from "@/lib/utils";

type PrivacyPoliciesSectionProps = {
  role: UserRole;
};

function PolicyBlocks({ blocks }: { blocks: PolicyBlock[] }) {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        if (block.kind === "paragraph") {
          return (
            <p key={index} className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {block.text}
            </p>
          );
        }
        if (block.kind === "warning") {
          return (
            <div
              key={index}
              className="rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
            >
              <p className="font-semibold text-amber-900 dark:text-amber-50">Important notice</p>
              <p className="mt-1">{block.text}</p>
            </div>
          );
        }
        if (block.kind === "bullets") {
          return (
            <ul key={index} className="space-y-2 pl-1">
              {block.items.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={index} className="space-y-2.5">
            {block.items.map((item, i) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[11px] font-bold text-sky-800 dark:bg-sky-950/60 dark:text-sky-200">
                  {i + 1}
                </span>
                <span className="pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

function PolicySectionCard({ section }: { section: PolicySection }) {
  return (
    <article
      id={section.id}
      className="scroll-mt-24 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
    >
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
        {section.number ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-sm font-bold text-white shadow-sm">
            {section.number}
          </span>
        ) : null}
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">{section.title}</h2>
        </div>
      </div>

      <div className="mt-4 space-y-5">
        {section.blocks?.length ? <PolicyBlocks blocks={section.blocks} /> : null}
        {section.subsections?.map((sub) => (
          <div key={sub.id} id={sub.id} className="scroll-mt-24 space-y-3 rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/40">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sub.title}</h3>
            <PolicyBlocks blocks={sub.blocks} />
          </div>
        ))}
      </div>
    </article>
  );
}

function DocumentView({ doc }: { doc: RolePolicyDocument }) {
  const [activeId, setActiveId] = useState(doc.sections[0]?.id ?? "");
  const ignoreScrollSpyUntil = useRef(0);

  const toc = useMemo(
    () =>
      doc.sections.map((section) => ({
        id: section.id,
        number: section.number,
        title: section.title,
      })),
    [doc.sections],
  );

  useEffect(() => {
    setActiveId(doc.sections[0]?.id ?? "");
  }, [doc]);

  useEffect(() => {
    const nodes = doc.sections
      .map((section) => document.getElementById(section.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < ignoreScrollSpyUntil.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveId(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [doc]);

  function jumpToSection(id: string) {
    setActiveId(id);
    ignoreScrollSpyUntil.current = Date.now() + 1200;
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  const activeIndex = Math.max(
    0,
    toc.findIndex((item) => item.id === activeId),
  );
  const progress = toc.length ? Math.round(((activeIndex + 1) / toc.length) * 100) : 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <nav className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/5">
          <div className="relative overflow-hidden border-b border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 px-4 py-3.5 dark:border-sky-900/40 dark:from-sky-950/50 dark:via-slate-900 dark:to-cyan-950/30">
            <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-sky-300/20 blur-2xl" />
            <div className="relative flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
                <ListTree className="h-4 w-4" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
                  Contents
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {toc.length} sections · jump to a topic
                </p>
              </div>
            </div>
            <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950/60">
              <div
                className="h-full rounded-full bg-linear-to-r from-sky-500 to-cyan-400"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <ul className="max-h-[min(68vh,540px)] space-y-1 overflow-y-auto p-2.5">
            {toc.map((item) => {
              const isActive = activeId === item.id;
              return (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      jumpToSection(item.id);
                    }}
                    className={cn(
                      "group relative flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left",
                      isActive
                        ? "bg-sky-50 shadow-sm ring-1 ring-sky-200/80 dark:bg-sky-950/45 dark:ring-sky-800/60"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/70",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0 top-2 bottom-2 w-0.5 rounded-full",
                        isActive ? "bg-sky-500" : "bg-transparent group-hover:bg-slate-300 dark:group-hover:bg-slate-600",
                      )}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold",
                        isActive
                          ? "bg-sky-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:bg-slate-700",
                      )}
                    >
                      {item.number ?? "·"}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 pt-0.5 text-xs leading-snug",
                        isActive
                          ? "font-semibold text-sky-900 dark:text-sky-100"
                          : "font-medium text-slate-600 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-slate-100",
                      )}
                    >
                      {item.title}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      <div className="space-y-4">
        {doc.sections.map((section) => (
          <PolicySectionCard key={section.id} section={section} />
        ))}

        <div className="rounded-2xl border border-sky-200 bg-linear-to-r from-sky-50 via-white to-cyan-50 p-5 dark:border-sky-900/50 dark:from-sky-950/40 dark:via-slate-900 dark:to-cyan-950/30">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white">
              <BookOpenCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Acknowledgment</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{doc.acknowledgment}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyPoliciesSection({ role }: PrivacyPoliciesSectionProps) {
  const policyRole = role === "teacher" ? "teacher" : "student";
  const doc = getPrivacyPolicyForRole(policyRole);
  const isMentor = policyRole === "teacher";

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="relative overflow-hidden bg-linear-to-br from-sky-900 via-blue-900 to-cyan-900 px-5 py-7 text-white sm:px-7 sm:py-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-sky-300/15 blur-2xl" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
                <Shield className="h-3.5 w-3.5" />
                {doc.eyebrow}
              </p>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{doc.title}</h1>
              <p className="mt-3 text-sm leading-relaxed text-sky-100/90 sm:text-[15px]">{doc.intro}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
              {isMentor ? <ScrollText className="h-8 w-8 text-cyan-100" /> : <FileText className="h-8 w-8 text-cyan-100" />}
            </div>
          </div>
          <div className="relative mt-5 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5 font-medium text-sky-50">
              Last updated: {doc.lastUpdated}
            </span>
            <span className="rounded-full border border-white/15 bg-black/10 px-3 py-1.5 font-medium text-sky-50">
              Effective: {doc.effectiveDate}
            </span>
            <span className="rounded-full border border-cyan-200/30 bg-cyan-400/15 px-3 py-1.5 font-semibold text-cyan-50">
              Audience: {isMentor ? "Mentors" : "Students"}
            </span>
          </div>
        </div>
      </div>

      <DocumentView doc={doc} />
    </section>
  );
}
