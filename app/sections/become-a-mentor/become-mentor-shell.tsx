"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Globe,
  GraduationCap,
  Heart,
  LayoutDashboard,
  MessageSquareQuote,
  Mic2,
  Rocket,
  Settings2,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Video,
  Wallet,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { BadgePill } from "@/app/components/ui/badge-pill";
import Footer from "@/app/components/ui/Footer";
import { LandingHeader } from "@/app/sections/landing/landing-header";
import { AuthModal } from "@/app/components/ui/auth-modal";
import { ContactModal } from "@/app/components/ui/contact-modal";
import { readAuthSnapshot, subscribeAuthStore } from "@/lib/mock-auth";
import type { AuthUser } from "@/lib/mock-auth";
import { isComingSoonMode } from "@/lib/coming-soon";

// ─────────────────────────────────────────────────────────────
// Scroll-reveal hook
// ─────────────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ─────────────────────────────────────────────────────────────
// Section 1 — Hero
// ─────────────────────────────────────────────────────────────
function HeroSection({ onApply, hideCtAs = false }: { onApply: () => void; hideCtAs?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-white py-16 transition-colors dark:bg-slate-950 sm:py-20 lg:py-24">
      {/* Subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-80 dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right,rgba(14,165,233,.18) 1px,transparent 1px),linear-gradient(to bottom,rgba(14,165,233,.18) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden opacity-50 dark:block"
        style={{
          backgroundImage:
            "linear-gradient(to right,rgba(56,189,248,.1) 1px,transparent 1px),linear-gradient(to bottom,rgba(56,189,248,.1) 1px,transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute -top-32 left-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-sky-400/20 blur-3xl dark:bg-sky-600/20" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-brand-primary/10 blur-3xl" />

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        {/* Left */}
        <div className="space-y-6">
          <BadgePill icon={Sparkles} variant="sky">
            For Educators &amp; Experts
          </BadgePill>

          <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Transform Your{" "}
            <span className="bg-linear-to-r from-sky-500 to-brand-primary bg-clip-text text-transparent">
              Expertise
            </span>{" "}
            into Impact.
          </h1>

          <p className="max-w-lg text-lg text-slate-600 dark:text-slate-300">
            Join a global community of leaders. Share your knowledge through
            live{" "}
            <span className="font-semibold text-sky-500">1-to-1 sessions</span>,
            build your legacy, and earn on your own terms — no classroom
            required.
          </p>

          {/* CTA_HIDDEN — mentor apply until full launch */}
          {!hideCtAs ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" size="lg" iconRight={ArrowRight} onClick={onApply}>
                Apply to be a Mentor
              </Button>
              <Link
                href="#how-it-works"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-sky-600 dark:hover:text-sky-400"
              >
                See how it works
              </Link>
            </div>
          ) : null}

          {/* Mini stat row */}
          <div className="flex flex-wrap gap-6 pt-2">
            {[
              { value: "500+", label: "Active Mentors" },
              { value: "4.9★", label: "Average Rating" },
              { value: "৳99", label: "Starting per session" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right — illustration card stack */}
        <div className="relative flex items-center justify-center">
          {/* Outer ring */}
          <div className="relative flex h-[380px] w-[380px] items-center justify-center rounded-full border border-sky-200/60 dark:border-sky-800/40 sm:h-[440px] sm:w-[440px]">
            <div className="absolute inset-5 rounded-full border border-sky-100/70 dark:border-sky-900/50" />
            <div className="absolute inset-10 rounded-full bg-linear-to-br from-sky-50 via-white to-sky-100 shadow-inner dark:from-slate-800 dark:via-slate-900 dark:to-slate-800" />

            {/* Center — mentor character, transparent float */}
            <div
              className="relative z-10 flex flex-col items-center"
              style={{ transform: "perspective(900px) rotateY(-5deg) rotateX(-2deg) rotate(6deg)", transformStyle: "preserve-3d" }}
            >
              {/* Diffused blue ground glow */}
              <div className="absolute bottom-4 left-1/2 h-16 w-48 -translate-x-1/2 rounded-full bg-brand-primary/40 blur-2xl" />

              <Image
                src="/images/mentor-img.png"
                alt="Mentor"
                width={280}
                height={340}
                priority
                className="relative h-[300px] w-auto object-contain sm:h-[340px]"
                style={{
                  filter:
                    "drop-shadow(0 0 28px rgba(29,140,255,0.55)) drop-shadow(0 20px 40px rgba(29,140,255,0.35)) drop-shadow(0 4px 12px rgba(0,0,0,0.2))",
                }}
              />

              {/* Verified badge — floats beside the character */}
              <div className="absolute right-0 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary shadow-lg shadow-brand-primary/50 ring-2 ring-white dark:ring-slate-800">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>

              {/* Label pill below the character */}
              <div className="relative -mt-2 inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-white/90 px-3 py-1 text-[11px] font-semibold text-sky-700 shadow-md backdrop-blur-sm dark:border-sky-800/60 dark:bg-slate-800/90 dark:text-sky-300">
                <Sparkles className="h-3 w-3" />
                You, as a Mentor
              </div>
            </div>

            {/* Floating cards */}
            {[
              { icon: CircleDollarSign, label: "Earn Every Session", color: "text-emerald-500", top: "-top-5", left: "left-12", rotate: "-rotate-3" },
              { icon: Users, label: "1-to-1 Sessions", color: "text-sky-500", top: "top-8", left: "-left-6", rotate: "rotate-2" },
              { icon: Star, label: "Top Expert Badge", color: "text-amber-500", top: "top-8", right: "-right-6", rotate: "-rotate-2" },
              { icon: TrendingUp, label: "Grow Your Brand", color: "text-brand-primary", bottom: "-bottom-4", left: "left-16", rotate: "rotate-1" },
            ].map(({ icon: Icon, label, color, top, left, right, bottom, rotate }) => (
              <div
                key={label}
                className={`absolute z-20 flex items-center gap-2 rounded-2xl border border-white/80 bg-white/90 px-3 py-2 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/90 ${top ?? ""} ${left ?? ""} ${right ?? ""} ${bottom ?? ""} ${rotate}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${color}`} />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 2 — 3-Step Success Cycle
// ─────────────────────────────────────────────────────────────
function SuccessCycleSection() {
  const { ref, visible } = useScrollReveal();

  const steps = [
    {
      num: "01",
      icon: Settings2,
      title: "Curate Your Space",
      description:
        "Design your mentor profile, showcase your expertise, and set custom 1-to-1 availability windows that fit your schedule.",
      color: "from-sky-500 to-cyan-400",
      glow: "shadow-sky-500/25",
    },
    {
      num: "02",
      icon: Video,
      title: "Connect &amp; Guide",
      description:
        "Accept booking requests from learners whose goals match your domain. Each session is a private, focused 1-on-1 experience.",
      color: "from-violet-500 to-indigo-500",
      glow: "shadow-violet-500/25",
    },
    {
      num: "03",
      icon: TrendingUp,
      title: "Scale Your Influence",
      description:
        "Earn directly after every successful session while building a portfolio of mentees and a reputation as a top-tier expert.",
      color: "from-emerald-500 to-teal-400",
      glow: "shadow-emerald-500/25",
    },
  ];

  return (
    <section
      id="how-it-works"
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-linear-to-b from-slate-100 via-sky-50/40 to-slate-100 py-16 transition-colors dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center scroll-reveal ${visible ? "is-visible" : ""}`}>
          <BadgePill icon={Rocket} variant="sky">
            3-Step Journey
          </BadgePill>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Your path from expert to mentor
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Three clear steps to go from sign-up to your first paid session.
          </p>
        </div>

        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          {/* Connector line */}
          <div className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-12 hidden border-t-2 border-dashed border-sky-300/70 dark:border-sky-700/50 md:block" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <article
                key={step.num}
                className={`relative scroll-reveal rounded-3xl border border-slate-200/80 bg-white/60 p-7 text-center shadow-lg backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 dark:border-slate-700 dark:bg-slate-800/60 ${visible ? "is-visible" : ""}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <span className="absolute right-5 top-5 text-5xl font-black text-slate-100 dark:text-slate-700/80 select-none">
                  {step.num}
                </span>
                <div
                  className={`mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br ${step.color} shadow-xl ${step.glow} text-white`}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <h3
                  className="mt-5 text-xl font-semibold text-slate-900 dark:text-slate-100"
                  dangerouslySetInnerHTML={{ __html: step.title }}
                />
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 3 — Mentor Support Suite
// ─────────────────────────────────────────────────────────────
function SupportSuiteSection() {
  const { ref, visible } = useScrollReveal();

  const features = [
    {
      icon: LayoutDashboard,
      title: "Personal Dashboard",
      description:
        "Real-time tracking of bookings, earnings, and student feedback — all in one clean interface.",
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950/40",
      border: "border-sky-200/70 dark:border-sky-800/40",
    },
    {
      icon: Video,
      title: "Integrated Toolkit",
      description:
        "Built-in video calling, shared whiteboard, and live notes — purpose-built for 1-to-1 sessions.",
      color: "text-violet-500",
      bg: "bg-violet-50 dark:bg-violet-950/40",
      border: "border-violet-200/70 dark:border-violet-800/40",
    },
    {
      icon: Globe,
      title: "Marketing Engine",
      description:
        "We handle SEO and lead generation. You focus on teaching — we'll make sure students find you.",
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      border: "border-emerald-200/70 dark:border-emerald-800/40",
    },
    {
      icon: Wallet,
      title: "Flexible Payouts",
      description:
        "Secure, automated payments hit your account directly after every successful session. Zero delays.",
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/40",
      border: "border-amber-200/70 dark:border-amber-800/40",
    },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-white py-16 transition-colors dark:bg-slate-950 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center scroll-reveal ${visible ? "is-visible" : ""}`}>
          <BadgePill icon={BadgeCheck} variant="green">
            You&apos;re Not Alone
          </BadgePill>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything you need to succeed
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            MentorLagbe equips you with a full suite of tools so you can focus
            purely on teaching.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className={`scroll-reveal group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${f.bg} ${f.border} ${visible ? "is-visible" : ""}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {/* Glassmorphism shimmer */}
                <div className="pointer-events-none absolute inset-0 rounded-3xl bg-white/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:bg-white/5" />
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md dark:bg-slate-800 ${f.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{f.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 4 — Growth & Branding Spotlight
// ─────────────────────────────────────────────────────────────
function BrandingSpotlightSection() {
  const { ref, visible } = useScrollReveal();

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="relative overflow-hidden bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 py-20 sm:py-24"
    >
      {/* Glow */}
      <div className="pointer-events-none absolute -left-32 top-0 h-[500px] w-[500px] rounded-full bg-brand-primary/15 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-sky-400/10 blur-[80px]" />

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-3xl text-center scroll-reveal ${visible ? "is-visible" : ""}`}>
          <BadgePill icon={Mic2} variant="sky" className="border-sky-500/40 bg-sky-950/60 text-sky-300">
            Personal Branding
          </BadgePill>

          <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            More than just teaching.
          </h2>
          <p className="mt-5 text-lg text-slate-300">
            When you mentor on MentorLagbe, you don&apos;t just share knowledge — you
            build a legacy. Our platform positions you as a{" "}
            <span className="font-semibold text-sky-400">Top 1% Industry Expert</span>,
            opening doors to speaking engagements, professional networks, and
            career-defining opportunities.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: Star, label: "Expert Badge", desc: "Verified credentials visible to thousands of students" },
              { icon: Mic2, label: "Speaking Doors", desc: "Get discovered for panels, podcasts & conferences" },
              { icon: BrainCircuit, label: "Thought Leadership", desc: "Build a following around your domain knowledge" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left backdrop-blur-sm"
              >
                <Icon className="h-6 w-6 text-sky-400" />
                <p className="mt-3 font-semibold text-white">{label}</p>
                <p className="mt-1 text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 5 — Earnings Calculator
// ─────────────────────────────────────────────────────────────
function EarningsCalculatorSection() {
  const { ref, visible } = useScrollReveal();
  const [hours, setHours] = useState(5);
  const [rate, setRate] = useState(500);
  const monthly = hours * 4 * rate;

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-white py-16 transition-colors dark:bg-slate-950 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center scroll-reveal ${visible ? "is-visible" : ""}`}>
          <BadgePill icon={BarChart3} variant="sky">
            Earnings Potential
          </BadgePill>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            See your potential income
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            Adjust the sliders and discover what you could earn per month.
          </p>
        </div>

        <div className={`mx-auto mt-10 max-w-xl scroll-reveal ${visible ? "is-visible" : ""}`}>
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            {/* Hours slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Hours per week
                </label>
                <span className="text-sm font-bold text-sky-500">{hours}h / week</span>
              </div>
              <input
                type="range"
                min={1}
                max={20}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>1h</span><span>20h</span>
              </div>
            </div>

            {/* Rate slider */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Hourly rate (BDT)
                </label>
                <span className="text-sm font-bold text-sky-500">৳{rate.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={99}
                max={2000}
                step={50}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full accent-sky-500"
              />
              <div className="flex justify-between text-xs text-slate-400">
                <span>৳99</span><span>৳2,000</span>
              </div>
            </div>

            {/* Result */}
            <div className="mt-8 rounded-2xl bg-linear-to-br from-brand-primary to-sky-400 p-6 text-center text-white shadow-lg shadow-brand-primary/30">
              <p className="text-sm font-medium opacity-80">Estimated monthly earnings</p>
              <p className="mt-1 text-5xl font-black tracking-tight">৳{monthly.toLocaleString()}</p>
              <p className="mt-2 text-xs opacity-70">
                {hours}h/week × 4 weeks × ৳{rate.toLocaleString()}/hour
              </p>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              Estimates are illustrative. Actual earnings depend on session bookings.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 6 — Quality Standards
// ─────────────────────────────────────────────────────────────
function QualityStandardsSection() {
  const { ref, visible } = useScrollReveal();

  const standards = [
    {
      icon: BookOpen,
      title: "Deep Domain Expertise",
      description:
        "We look for industry-specific mastery — not generalists. Whether it's CSE, BBA, or beyond, you need real-world depth.",
    },
    {
      icon: Heart,
      title: "Empathy &amp; Communication",
      description:
        "Great mentors listen first. Strong interpersonal skills and the ability to explain complex ideas simply are non-negotiable.",
    },
    {
      icon: GraduationCap,
      title: "Commitment to Student Growth",
      description:
        "You measure success by your mentee's breakthroughs. A growth mindset and long-term focus set our mentors apart.",
    },
  ];

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-linear-to-b from-slate-50 to-white py-16 transition-colors dark:from-slate-900 dark:to-slate-950 sm:py-20"
    >
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center scroll-reveal ${visible ? "is-visible" : ""}`}>
          <BadgePill icon={BadgeCheck} variant="green">
            Our Standards
          </BadgePill>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            What we look for in a Mentor
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            We keep our community selective so students always get the best.
          </p>
        </div>

        <div className="mt-12 space-y-5">
          {standards.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.title}
                className={`scroll-reveal flex items-start gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-500 dark:border-slate-700 dark:bg-slate-800 ${visible ? "is-visible" : ""}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 dark:bg-sky-950/60 dark:text-sky-400">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3
                    className="text-base font-semibold text-slate-900 dark:text-slate-100"
                    dangerouslySetInnerHTML={{ __html: s.title }}
                  />
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">{s.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 7 — Testimonial Slider
// ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    quote:
      "MentorLagbe gave me the platform I needed to turn my niche CSE expertise into a real income stream. The 1-to-1 format is perfect — students get exactly what they need.",
    name: "Arif Rahman",
    title: "Senior Software Engineer",
    company: "Brain Station 23",
    initials: "AR",
    color: "bg-sky-500",
  },
  {
    quote:
      "I love that I can set my own schedule. Between my full-time role and mentoring, I've helped over 40 students crack their university exams — and it's incredibly fulfilling.",
    name: "Nusrat Jahan",
    title: "Finance Analyst",
    company: "BRAC Bank",
    initials: "NJ",
    color: "bg-violet-500",
  },
  {
    quote:
      "The integrated toolkit — video calling, shared notes — makes every session smooth. MentorLagbe handles the tech so I can focus on teaching.",
    name: "Fahim Hossain",
    title: "ML Engineer",
    company: "Shohoz",
    initials: "FH",
    color: "bg-emerald-500",
  },
  {
    quote:
      "My brand grew more in 6 months on MentorLagbe than in 2 years anywhere else. Students leave reviews, which opens doors I never expected.",
    name: "Tasmia Islam",
    title: "Business Strategy Lead",
    company: "Pathao",
    initials: "TI",
    color: "bg-amber-500",
  },
];

function TestimonialSection() {
  const { ref, visible } = useScrollReveal();
  const [index, setIndex] = useState(0);

  const prev = useCallback(() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length), []);
  const next = useCallback(() => setIndex((i) => (i + 1) % testimonials.length), []);

  const t = testimonials[index]!;

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className="bg-white py-16 transition-colors dark:bg-slate-950 sm:py-20"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`mx-auto max-w-2xl text-center scroll-reveal ${visible ? "is-visible" : ""}`}>
          <BadgePill icon={MessageSquareQuote} variant="sky">
            Mentor Stories
          </BadgePill>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Hear from our mentors
          </h2>
        </div>

        <div className={`mx-auto mt-10 max-w-3xl scroll-reveal ${visible ? "is-visible" : ""}`}>
          <div className="relative rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-700 dark:bg-slate-800 sm:p-10">
            {/* Quote icon */}
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/60">
              <MessageSquareQuote className="h-5 w-5 text-sky-500" />
            </div>

            <p className="text-xl font-medium leading-8 text-slate-900 dark:text-slate-100 sm:text-2xl">
              &ldquo;{t.quote}&rdquo;
            </p>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-white ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t.title} · {t.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prev}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-sky-600"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-200 dark:hover:border-sky-600"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Dots */}
            <div className="mt-6 flex justify-center gap-1.5">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-sky-500" : "w-2 bg-slate-300 dark:bg-slate-600"}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Section 8 — Application Form
// ─────────────────────────────────────────────────────────────
const expertiseOptions = [
  "Computer Science & Engineering",
  "Business Administration",
  "Data Science & AI",
  "Web Development",
  "Mobile Development",
  "Finance & Accounting",
  "Mathematics & Statistics",
  "Physics & Engineering",
  "Marketing & Communication",
  "Other",
];

function ApplicationSection({ hideCtAs = false }: { hideCtAs?: boolean }) {
  const { ref, visible } = useScrollReveal();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    title: "",
    expertise: "",
    motivation: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="apply"
      className="bg-linear-to-b from-slate-50 to-white py-16 transition-colors dark:from-slate-900 dark:to-slate-950 sm:py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className={`scroll-reveal ${visible ? "is-visible" : ""}`}>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800 lg:grid lg:grid-cols-2">
            {/* Left */}
            <div className="relative flex flex-col justify-center overflow-hidden bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 p-10">
              <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-brand-primary/20 blur-3xl" />
              <BadgePill icon={Sparkles} variant="sky" className="w-fit border-sky-500/30 bg-sky-950/60 text-sky-300">
                Join the Community
              </BadgePill>
              <h2 className="mt-5 text-3xl font-extrabold text-white sm:text-4xl">
                Ready to start?
              </h2>
              <p className="mt-3 text-base text-slate-300">
                The application takes 2 minutes. Once approved, you&apos;ll set up
                your profile and can start accepting bookings within 24 hours.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: BadgeCheck, label: "Fast approval process" },
                  { icon: CircleDollarSign, label: "Earn from your first session" },
                  { icon: Users, label: "Join 500+ active mentors" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/20">
                      <Icon className="h-4 w-4 text-sky-400" />
                    </div>
                    <span className="text-sm font-medium text-slate-200">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Form (CTA_HIDDEN when coming soon) */}
            <div className="p-8 sm:p-10">
              {hideCtAs ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Mentor applications will open when the platform launches. Follow us on social
                  channels for updates.
                </p>
              ) : submitted ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 py-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                    <BadgeCheck className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Application Received!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Our team will review your application and get back to you within 24 hours.
                  </p>
                  <Button variant="primary" onClick={() => setSubmitted(false)}>Submit Another</Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Arif Rahman"
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Professional Title / LinkedIn URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Senior Engineer at Google or linkedin.com/in/..."
                      value={form.title}
                      onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      Primary Expertise <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={form.expertise}
                      onChange={(e) => setForm((prev) => ({ ...prev, expertise: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:focus:border-sky-500"
                    >
                      <option value="">Select your domain...</option>
                      {expertiseOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                      What motivates you to mentor?
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share what drives you to guide students..."
                      value={form.motivation}
                      onChange={(e) => setForm((prev) => ({ ...prev, motivation: e.target.value }))}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/20 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="lg" className="w-full" iconRight={ArrowRight}>
                    Submit Application
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Shell — composes everything
// ─────────────────────────────────────────────────────────────
type AuthEntryView = "login" | "register" | "verify" | "forgot" | "reset";

export function BecomeMentorShell() {
  const router = useRouter();
  const comingSoon = isComingSoonMode();
  const [manualAuthView, setManualAuthView] = useState<AuthEntryView>("login");
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const user = useSyncExternalStore<AuthUser | null>(
    subscribeAuthStore,
    readAuthSnapshot,
    () => null
  );

  const search = useSyncExternalStore(
    () => () => undefined,
    () => window.location.search,
    () => ""
  );
  const query = useMemo(() => new URLSearchParams(search), [search]);
  const queryAuthView =
    (["login", "register", "verify", "forgot", "reset"] as const).find(
      (v) => v === query.get("auth")
    ) ?? null;
  const isModalOpen = manualModalOpen || Boolean(queryAuthView);
  const authView = queryAuthView ?? manualAuthView;

  function scrollToForm() {
    document.getElementById("apply")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
        <LandingHeader
          user={user}
          comingSoon={comingSoon}
          onAuthClick={() => {
            setManualAuthView("login");
            setManualModalOpen(true);
          }}
          onDashboardClick={() => router.push("/dashboard")}
          onContactClick={() => setIsContactModalOpen(true)}
          onLearnNowClick={() => router.push("/#learn-now")}
        />
        <main>
          <HeroSection onApply={scrollToForm} hideCtAs={comingSoon} />
          <SuccessCycleSection />
          <SupportSuiteSection />
          <BrandingSpotlightSection />
          <EarningsCalculatorSection />
          <QualityStandardsSection />
          <TestimonialSection />
          <ApplicationSection hideCtAs={comingSoon} />
        </main>
        <Footer />
      </div>

      {/* BACKEND_LIVE — auth modal */}
      {!comingSoon && isModalOpen ? (
        <AuthModal
          key={authView}
          open={isModalOpen}
          initialView={authView}
          initialUserId={query.get("userId") ?? ""}
          initialEmail={query.get("email") ?? ""}
          onClose={() => {
            setManualModalOpen(false);
            if (queryAuthView) router.replace("/become-a-mentor");
          }}
          onAuthSuccess={() => setManualModalOpen(false)}
        />
      ) : null}

      <ContactModal
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />
    </>
  );
}
