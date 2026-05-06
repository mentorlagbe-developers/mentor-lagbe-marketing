"use client";

import { AlertTriangle, ArrowRight, CheckCircle2, Code2, MessageCircleMore, Video } from "lucide-react";

type ConfusionClaritySectionProps = {
  title?: string;
  subtitle?: string;
  points?: string[];
};

const defaultPoints = [
  "Get focused support for your exact blocker",
  "Screen-share your code and debug live",
  "Leave with a clear plan and working solution",
];

export function ConfusionClaritySection({
  title = "From Confusion to Clarity",
  subtitle = "Turn frustrating hours into productive minutes with one-to-one mentor sessions.",
  points = defaultPoints,
}: ConfusionClaritySectionProps) {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">Mentor Lagbe</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{title}</h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">{subtitle}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 p-6 text-slate-200 shadow-2xl shadow-slate-900/15">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(148,163,184,0.15),transparent_60%)]" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Confusion
              </div>
              <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-400">
                  <Code2 className="h-4 w-4" />
                  <span className="text-xs">Unhandled edge case in authentication flow</span>
                </div>
                <div className="space-y-2 opacity-70">
                  <div className="h-2 w-11/12 rounded bg-slate-600/70" />
                  <div className="h-2 w-10/12 rounded bg-slate-600/70" />
                  <div className="h-2 w-8/12 rounded bg-slate-600/70" />
                  <div className="h-2 w-9/12 rounded bg-slate-600/70" />
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-300">
                <MessageCircleMore className="h-4 w-4" />
                Stuck for 4+ hours
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-2xl shadow-sky-500/10">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Clarity
              </div>
              <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-white to-sky-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Live 1-on-1 Session</p>
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">Active</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Mentor is guiding line-by-line</p>
                    <p className="text-xs text-slate-500">Code fixed with clear explanation</p>
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
                Aha moment unlocked
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
