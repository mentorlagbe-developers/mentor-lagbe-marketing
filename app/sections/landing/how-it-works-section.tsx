"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CalendarCheck2, Search, Video } from "lucide-react";

export type WorkflowStep = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type HowItWorksSectionProps = {
  heading?: string;
  subtitle?: string;
  steps?: WorkflowStep[];
};

const defaultSteps: WorkflowStep[] = [
  {
    title: "Search Topic",
    description: "Choose the exact topic or blocker you need help with.",
    icon: Search,
  },
  {
    title: "Book Slot",
    description: "Pick a mentor and reserve a time that matches your schedule.",
    icon: CalendarCheck2,
  },
  {
    title: "Start 1-on-1 Call",
    description: "Join the live session and solve your problem in real-time.",
    icon: Video,
  },
];

export function HowItWorksSection({
  heading = "How it Works",
  subtitle = "Three quick steps from confusion to solution.",
  steps = defaultSteps,
}: HowItWorksSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!sectionRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-linear-to-b from-slate-200 via-sky-50/60 to-slate-300 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-3xl text-center scroll-reveal ${isVisible ? "is-visible" : ""}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">3-Step Sprint</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{heading}</h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">{subtitle}</p>
        </div>

        <div className="relative mt-10 grid gap-6 md:grid-cols-3">
          <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-10 hidden border-t-2 border-dashed border-sky-300 md:block" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className={`relative scroll-reveal transform-gpu rounded-3xl border border-slate-300/85 bg-white/40 p-6 text-center shadow-[0_18px_42px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md transition-all duration-500 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-[0_24px_54px_-18px_rgba(14,165,233,0.35)] ${isVisible ? "is-visible" : ""}`}
                style={{ transitionDelay: `${90 + index * 100}ms` }}
              >
                <span className="absolute right-4 top-4 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-white/60 bg-white/70 px-2 text-xs font-semibold text-sky-700">
                  {index + 1}
                </span>
                <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/70 bg-linear-to-br from-white/75 to-sky-100/60 text-sky-500 shadow-[0_10px_30px_rgba(14,165,233,0.25)] backdrop-blur-sm">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
