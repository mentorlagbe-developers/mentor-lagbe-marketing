"use client";

import { BookOpen, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type StudentHeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaIcon?: LucideIcon;
  ctaValue: string;
  badge: string;
  gradientFrom: string;
  gradientTo: string;
};

type StudentHeroSliderProps = {
  slides: StudentHeroSlide[];
};

export function StudentHeroSlider({ slides }: StudentHeroSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="relative min-h-56">
        {slides.map((slide, index) => (
          <article
            key={slide.id}
            className={cn(
              "absolute inset-0 grid items-center gap-5 px-5 py-5 transition-opacity duration-500 lg:grid-cols-[1fr_auto]",
              activeIndex === index ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(105deg, ${slide.gradientFrom}, ${slide.gradientTo})`,
              }}
            />
            <div className="relative z-10">
              <h2 className="max-w-xl text-2xl font-extrabold text-white md:text-3xl">{slide.title}</h2>
              <p className="mt-1.5 max-w-lg text-xs text-slate-100 md:text-sm">{slide.subtitle}</p>
              <div className="mt-4 flex items-center gap-3">
                <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-primary transition hover:bg-slate-100">
                  <span className="inline-flex items-center gap-1.5">
                    {slide.ctaIcon ? <slide.ctaIcon className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                    {slide.ctaLabel}
                  </span>
                </button>
                <span className="text-xl font-bold text-white">{slide.ctaValue}</span>
                <span className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">{slide.badge}</span>
              </div>
            </div>

            <div className="relative z-10 hidden max-w-68 rounded-2xl border border-white/20 bg-black/20 px-4 py-3 text-white backdrop-blur-sm lg:block">
              <p className="text-xs">Course Instructor</p>
              <p className="text-lg font-semibold">Mentor Lagbe Team</p>
              <p className="text-xs text-slate-200">Certified mentors for board, IELTS, and skill growth.</p>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={cn(
              "h-2 rounded-full transition-all",
              index === activeIndex ? "w-6 bg-white" : "w-2 bg-white/50"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
