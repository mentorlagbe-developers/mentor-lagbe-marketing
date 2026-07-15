"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

type AboutHeroSectionProps = {
  data: {
    badge: string;
    title: string;
    description: string;
    primaryCta: { label: string; href: string };
    secondaryCta: { label: string; href: string };
  };
  onPrimaryCtaClick?: () => void;
};

export function AboutHeroSection({ data, onPrimaryCtaClick }: AboutHeroSectionProps) {
  const gradientPhrase = "Ambition and Expertise";
  const leadTitle = data.title.replace(gradientPhrase, "").trim();

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 sm:py-20">
      <div className="pointer-events-none absolute -left-28 top-8 h-72 w-72 rounded-full bg-sky-200/45 blur-3xl dark:bg-sky-900/45" />
      <div className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/40" />
      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="space-y-6"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            {data.badge}
          </span>
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {leadTitle}{" "}
            <span className="bg-linear-to-r from-indigo-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
              {gradientPhrase}
            </span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            {data.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {onPrimaryCtaClick ? (
              <button
                type="button"
                onClick={onPrimaryCtaClick}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-secondary"
              >
                {data.primaryCta.label}
              </button>
            ) : (
              <Link
                href={data.primaryCta.href}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-secondary"
              >
                {data.primaryCta.label}
              </Link>
            )}
            <Link
              href={data.secondaryCta.href}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-[0_0_0_rgba(56,189,248,0)] transition hover:shadow-[0_0_24px_rgba(56,189,248,0.35)] dark:border-sky-700 dark:bg-slate-900 dark:text-sky-300"
            >
              {data.secondaryCta.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="relative mx-auto flex h-[320px] w-full max-w-xl items-center justify-center rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/65"
        >
          <div className="absolute inset-6 rounded-[20px] border border-sky-200/80 dark:border-sky-800/60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.22),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.24),transparent_48%)]" />
          <div className="relative grid w-full gap-3 text-center">
            <div className="mx-auto h-3 w-3 rounded-full bg-sky-500" />
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-600 dark:text-sky-300">
              Mentor <span className="text-slate-400">x</span> Student
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Connected Learning Graph
            </p>
            <p className="mx-auto max-w-sm text-sm text-slate-600 dark:text-slate-300">
              Real-time guidance links every learner with the right mentor, right topic, and right timing.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
