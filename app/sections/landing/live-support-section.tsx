 "use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Clock, UserRound, Video } from "lucide-react";
import { BadgePill } from "@/app/components/ui/badge-pill";
import { Button } from "@/app/components/ui/button";
import { FeaturePoint } from "@/app/components/ui/feature-point";

type LiveSupportSectionProps = {
  onCtaClick?: () => void;
};

const features = [
  {
    icon: UserRound,
    title: "Personalized 1-on-1 Guidance",
    description: "Direct mentorship tailored to your specific problem",
  },
  {
    icon: BadgeCheck,
    title: "Guaranteed Expert Match",
    description: "Work with verified, qualified instructors only",
  },
  {
    icon: Clock,
    title: "Custom Scheduling",
    description: "Pick any time that works for you",
  },
] as const;

export function LiveSupportSection({ onCtaClick }: LiveSupportSectionProps) {
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
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-white py-8 sm:py-6 lg:py-8"
    >
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(186,230,255,0.18),transparent)]" />

      {/* Premium Service badge — centered above the two-column grid */}
      <div className={`mb-10 flex justify-center px-4 scroll-reveal ${isVisible ? "is-visible" : ""}`}>
        <BadgePill icon={Video} variant="sky">
          One-to-One Mentorship
        </BadgePill>
      </div>

      <div
        className={`mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 scroll-reveal ${isVisible ? "is-visible" : ""}`}
      >

        {/* ── Left: illustration ── */}
        <div className="relative flex items-center justify-center">
          {/* Live Support badge */}
          <div className="absolute left-0 top-0 z-10 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-sky-500" />
            <span className="text-sm font-semibold text-slate-800">Live Support</span>
          </div>

          {/* Image */}
          <div className="relative w-full max-w-lg pt-2">
            <Image
              src="/images/live-img.svg"
              alt="Mentor and student in a live learning session"
              width={560}
              height={480}
              className="h-auto w-full object-contain"
              priority
            />
          </div>
        </div>

        {/* ── Right: content ── */}
        <div className="flex flex-col items-start gap-6">
          {/* Headline */}
          <div>
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl">
              Get <span className="text-sky-500">unstuck</span>
              <br />
              Get <span className="text-sky-500">expert help!</span>
            </h2>
          </div>

          {/* Sub-headline */}
          <div className="space-y-1 text-base text-slate-600 sm:text-[1.05rem]">
            <p>
              Schedule on{" "}
              <span className="font-semibold text-sky-500">your time</span>
              , solve your biggest problems.
            </p>
            <p>
              <span className="font-semibold text-sky-500">1-on-1 support</span>{" "}
              from qualified experts.
            </p>
          </div>

          {/* Feature points */}
          <div className="flex w-full flex-col gap-4">
            {features.map((f) => (
              <FeaturePoint
                key={f.title}
                icon={f.icon}
                title={f.title}
                description={f.description}
              />
            ))}
          </div>

          {/* CTA button */}
          <div className="mt-2 w-full">
            <Button
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={onCtaClick}
              className="h-14 w-full rounded-xl text-sm font-bold uppercase tracking-widest"
            >
              Find Your Mentor Now
            </Button>

            {/* Price sub-line */}
            <p className="mt-3 text-center text-sm text-slate-500">
              Only{" "}
              <span className="font-semibold text-slate-800">৳99</span> per
              session
            </p>

            {/* Social proof */}
            <p className="mt-1.5 text-center text-sm">
              <span className="font-semibold text-sky-500">1200+</span>{" "}
              <span className="text-slate-500">
                students solved their problems with 1-on-1 support
              </span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
