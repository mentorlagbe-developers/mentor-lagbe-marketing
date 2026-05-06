"use client";

import Image from "next/image";
import {
  AlarmClock,
  Brain,
  MousePointerClick,
  PieChart,
  Video,
  BadgeDollarSign,
  CalendarCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { FeatureCard } from "@/app/components/ui/FeatureCard";
import type { AuthUser } from "@/lib/mock-auth";

type HeroSectionProps = {
  user: AuthUser | null;
  onPrimaryAction: () => void;
};

export function HeroSection({ user, onPrimaryAction }: HeroSectionProps) {
  return (
    <section className="relative h-[calc(100vh-72px)] overflow-hidden pt-14 sm:pt-16">
      {/* White base */}
      <div className="absolute inset-0 -z-20 bg-white" />
      {/* Grid pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(125,211,252,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.35)_1px,transparent_1px)] bg-size-[56px_56px]" />

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">

        {/* ── Headline block ── */}
        <div className="mt-1 space-y-2 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl">
            Pick a <span className="text-sky-500">topic.</span> Pick a <span className="text-sky-500">time.</span>
            <br />
            Clear your <span className="text-sky-500">confusions.</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-slate-500">
            Get unstuck in minutes, not days. Live{" "}
            <span className="font-semibold text-sky-500">one-to-one</span>{" "}
            sessions built around your schedule.
          </p>
          <div className="flex justify-center pt-1">
            <Button variant="primary" size="md" onClick={onPrimaryAction} iconRight={Video}>
              {user ? "Go to Dashboard" : "Book Session"}
            </Button>
          </div>
        </div>

        {/* ── Hero image area ── */}
        <div className="relative mt-3 flex w-full flex-1 items-start justify-center">

          {/* ────────────────────────────────────────────
              LEFT FEATURE CARDS — scattered near circle
          ──────────────────────────────────────────── */}
          <div className="absolute left-0 top-0 hidden lg:block xl:left-4">

            {/* Card top-left — slightly tilted, close to the outer ring */}
            <FeatureCard
              title="Live 1-on-1 Sessions"
              subtitle="Real-time voice & screen with your tutor"
              icon={<Video className="h-4 w-4" />}
              iconPosition="left"
              variant="elevated"
              subtitleColor="text-sky-100"
              className="bg-linear-to-br from-cyan-600 via-sky-500 to-indigo-500 shadow-[0_14px_36px_rgba(14,116,215,0.32)]"
              style={{
                position: "absolute",
                top: "10px",
                left: "150px",
                transform: "rotate(-5deg)",
                zIndex: 20,
              }}
            />

            {/* Card mid-left — lower, different tilt */}
            <FeatureCard
              title="Starting at ৳99 / 30 min"
              subtitle="Affordable expert help, zero hidden fees"
              icon={<BadgeDollarSign className="h-4 w-4" />}
              iconPosition="left"
              variant="default"
              subtitleColor="text-cyan-100"
              className="bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_14px_36px_rgba(13,148,136,0.3)]"
              style={{
                position: "absolute",
                top: "140px",
                left: "120px",
                transform: "rotate(3deg)",
                zIndex: 20,
              }}
            />
          </div>

          {/* ────────────────────────────────────────────
              RIGHT FEATURE CARDS — scattered near circle
          ──────────────────────────────────────────── */}
          <div className="absolute right-0 top-0 hidden lg:block xl:right-4">

            {/* Card top-right */}
            <FeatureCard
              title="Book by the Topic"
              subtitle="Pay only for what you need — nothing more"
              icon={<CalendarCheck className="h-4 w-4" />}
              iconPosition="right"
              variant="elevated"
              subtitleColor="text-sky-100"
              className="bg-linear-to-br from-violet-600 via-indigo-500 to-blue-500 shadow-[0_14px_36px_rgba(79,70,229,0.32)]"
              style={{
                position: "absolute",
                top: "10px",
                right: "150px",
                transform: "rotate(4deg)",
                zIndex: 20,
              }}
            />

            {/* Card mid-right */}
            <FeatureCard
              title="Clear Doubts in Minutes"
              subtitle="Get unblocked fast — not in days"
              icon={<Zap className="h-4 w-4" />}
              iconPosition="right"
              variant="glass"
              subtitleColor="text-cyan-100"
              className="bg-linear-to-br from-fuchsia-500 via-pink-500 to-rose-500 shadow-[0_14px_36px_rgba(236,72,153,0.3)]"
              style={{
                position: "absolute",
                top: "140px",
                right: "120px",
                transform: "rotate(-3deg)",
                zIndex: 20,
              }}
            />
          </div>

          {/* ── Center circle + image + floating icons ── */}
          <div className="relative flex h-72 w-72 items-center justify-center overflow-visible sm:h-96 sm:w-96 lg:h-112 lg:w-md">
            {/* Outermost thin ring */}
            <div className="absolute inset-0 rounded-full border border-sky-200/70" />
            {/* Second ring */}
            <div className="absolute inset-5 rounded-full border border-sky-200/55" />
            {/* Gradient fill circle */}
            <div className="absolute inset-10 rounded-full bg-linear-to-b from-sky-100/70 via-sky-100/90 to-sky-200" />

            {/* Hero image */}
            <Image
              src="/images/hero-img.svg"
              alt="Learner studying with laptop"
              width={400}
              height={460}
              priority
              className="relative z-10 h-full w-auto object-contain drop-shadow-[0_24px_48px_rgba(14,165,233,0.35)]"
            />

            {/* Floating icon – top-left (Brain) */}
            <div className="absolute -left-5 top-16 z-20 rounded-full border border-sky-200 bg-white p-2.5 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] text-sky-400">
              <Brain className="h-6 w-6" />
            </div>
            {/* Floating icon – top-right (PieChart) */}
            <div className="absolute -right-5 top-16 z-20 rounded-full border border-sky-200 bg-white p-2.5 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] text-sky-400">
              <PieChart className="h-6 w-6" />
            </div>
            {/* Floating icon – mid-left (MousePointerClick) */}
            <div className="absolute -left-3 top-44 z-20 rounded-full border border-sky-200 bg-white p-2.5 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] text-sky-400">
              <MousePointerClick className="h-6 w-6" />
            </div>
            {/* Floating icon – mid-right (AlarmClock) */}
            <div className="absolute -right-3 top-44 z-20 rounded-full border border-sky-200 bg-white p-2.5 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] text-sky-400">
              <AlarmClock className="h-6 w-6" />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}