"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BookOpenCheck, ChevronRight, FileText, ListTree, ScrollText, Shield } from "lucide-react";
import { PolicyBlocks } from "@/app/components/policies/policy-blocks";
import type { PolicyDocument, PolicySection } from "@/data/policies/types";
import { cn } from "@/lib/utils";

type PolicySectionCardProps = {
  section: PolicySection;
};

function PolicySectionCard({ section }: PolicySectionCardProps) {
  return (
    <article
      id={section.id}
      className="scroll-mt-28 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6"
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
          <div key={sub.id} id={sub.id} className="scroll-mt-28 space-y-3 rounded-xl bg-slate-50/80 p-4 dark:bg-slate-800/40">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{sub.title}</h3>
            <PolicyBlocks blocks={sub.blocks} />
          </div>
        ))}
      </div>
    </article>
  );
}

type PolicyDocumentBodyProps = {
  doc: PolicyDocument;
  relatedPolicies?: Array<{ slug: string; label: string; eyebrow: string }>;
};

export function PolicyDocumentBody({ doc, relatedPolicies = [] }: PolicyDocumentBodyProps) {
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
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeIndex = Math.max(0, toc.findIndex((item) => item.id === activeId));
  const progress = toc.length ? Math.round(((activeIndex + 1) / toc.length) * 100) : 0;

  return (
    <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
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

          <ul className="max-h-[min(58vh,520px)] space-y-1 overflow-y-auto p-2.5">
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
                        "absolute bottom-2 left-0 top-2 w-0.5 rounded-full",
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

        {relatedPolicies.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Related policies</p>
            <ul className="mt-3 space-y-2">
              {relatedPolicies.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/policies/${item.slug}`}
                    className="group flex items-center justify-between gap-2 rounded-xl px-2.5 py-2 text-sm transition hover:bg-sky-50 dark:hover:bg-sky-950/30"
                  >
                    <span>
                      <span className="block font-medium text-slate-800 group-hover:text-sky-700 dark:text-slate-100 dark:group-hover:text-sky-300">
                        {item.label}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{item.eyebrow}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-sky-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
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

type PolicyDocumentHeroProps = {
  doc: PolicyDocument;
};

export function PolicyDocumentHero({ doc }: PolicyDocumentHeroProps) {
  const isMentorDoc = doc.slug === "mentor-guidelines";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="relative overflow-hidden bg-linear-to-br from-sky-900 via-blue-900 to-cyan-900 px-5 py-8 text-white sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-sky-300/15 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-100">
              <Shield className="h-3.5 w-3.5" />
              {doc.eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{doc.title}</h1>
            <p className="mt-4 text-sm leading-relaxed text-sky-100/90 sm:text-[15px]">{doc.intro}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
            {isMentorDoc ? (
              <ScrollText className="h-8 w-8 text-cyan-100" />
            ) : (
              <FileText className="h-8 w-8 text-cyan-100" />
            )}
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
            Audience: {doc.audience}
          </span>
        </div>
      </div>
    </div>
  );
}
