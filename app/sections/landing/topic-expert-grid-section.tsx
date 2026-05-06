"use client";

import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Blocks, BrainCircuit, Code2, Cpu, Globe, Shield } from "lucide-react";

export type TopicCard = {
  title: string;
  description: string;
  icon: LucideIcon;
  isFeatured?: boolean;
};

type TopicExpertGridSectionProps = {
  heading?: string;
  subtitle?: string;
  topics?: TopicCard[];
};

const defaultTopics: TopicCard[] = [
  {
    title: "Next.js",
    description: "App Router, rendering strategy, and production architecture.",
    icon: Code2,
    isFeatured: true,
  },
  {
    title: "System Design",
    description: "Scalable APIs, caching, reliability, and real-world tradeoffs.",
    icon: Blocks,
    isFeatured: true,
  },
  {
    title: "Cybersecurity",
    description: "Secure coding, auth hardening, and practical threat modeling.",
    icon: Shield,
    isFeatured: true,
  },
  {
    title: "JavaScript Core",
    description: "Closures, event loop, async flows, and modern patterns.",
    icon: Cpu,
  },
  {
    title: "Data Structures",
    description: "Interview-focused DSA with problem solving frameworks.",
    icon: BrainCircuit,
  },
  {
    title: "Web Fundamentals",
    description: "Performance, accessibility, and frontend best practices.",
    icon: Globe,
  },
];

export function TopicExpertGridSection({
  heading = "Topic-Wise Expert Grid",
  subtitle = "Pick a category and connect with mentors who specialize in exactly that domain.",
  topics = defaultTopics,
}: TopicExpertGridSectionProps) {
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
      { threshold: 0.18 }
    );

    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-slate-100 py-16 sm:py-20">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-3xl text-center scroll-reveal ${isVisible ? "is-visible" : ""}`}>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">Expert Categories</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{heading}</h2>
          <p className="mt-3 text-base text-slate-600 sm:text-lg">{subtitle}</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic, index) => {
            const Icon = topic.icon;
            return (
              <article
                key={topic.title}
                className={`group scroll-reveal transform-gpu rounded-[24px] border bg-white/40 p-5 shadow-[0_18px_42px_-20px_rgba(15,23,42,0.45)] backdrop-blur-md transition-all duration-500 ease-out will-change-transform hover:-translate-y-1.5 hover:shadow-[0_24px_54px_-18px_rgba(14,165,233,0.35)] ${isVisible ? "is-visible" : ""} ${
                  topic.isFeatured
                    ? "border-sky-200/75 border-t-4 border-t-sky-500"
                    : "border-slate-300/80"
                }`}
                style={{ transitionDelay: `${90 + index * 80}ms` }}
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/70 bg-white/65 text-sky-500 transition group-hover:bg-sky-500 group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{topic.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{topic.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
