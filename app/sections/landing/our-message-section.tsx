"use client";

import { Sparkles } from "lucide-react";

export function OurMessageSection() {
  return (
    <section className="px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 via-white to-cyan-50 p-6 shadow-[0_24px_60px_-40px_rgba(2,132,199,0.45)] sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold tracking-wide text-sky-700">
          <Sparkles className="h-3.5 w-3.5" />
          Our Message
        </div>
        <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Learn faster with the right mentor, right now.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
          Mentor Lagbe connects students with verified mentors for focused one-to-one sessions.
          Ask better questions, solve real problems, and build confidence with practical guidance
          tailored to your academic journey.
        </p>
      </div>
    </section>
  );
}

