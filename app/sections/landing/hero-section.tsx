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
import { BadgePill } from "@/app/components/ui/badge-pill";
import { useLocale, useT } from "@/lib/locale/locale-provider";

type HeroSectionProps = {
  user: AuthUser | null;
  comingSoon?: boolean;
  onPrimaryAction: () => void;
};

export function HeroSection({ user, comingSoon = false, onPrimaryAction }: HeroSectionProps) {
  const t = useT();
  const { locale } = useLocale();
  const isVisible = true;

  return (
    <section className="relative min-h-0 overflow-x-hidden pt-6 pb-8 transition-colors sm:min-h-[calc(100vh-72px)] sm:pt-12 sm:pb-8">
      <div className="absolute inset-0 -z-20 bg-white dark:bg-slate-950" />
      <div className={`mb-10 flex justify-center px-4 scroll-reveal ${isVisible ? "is-visible" : ""}`}>
        <BadgePill icon={Video} variant="sky">
          {comingSoon ? t("hero.badgeComingSoon") : t("hero.badge")}
        </BadgePill>
      </div>
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-90 dark:hidden"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(14,165,233,0.22) 1px, transparent 1px), linear-gradient(to bottom, rgba(14,165,233,0.22) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 -z-10 hidden opacity-60 dark:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(56,189,248,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(56,189,248,0.14) 1px, transparent 1px)",
          backgroundSize: "42px 42px",
        }}
      />

      <div className="mx-auto flex h-full w-full max-w-7xl flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="relative z-20 mt-1 space-y-2 text-center">
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            {comingSoon ? (
              <>
                {locale === "en" ? (
                  <>
                    Live <span className="text-sky-500">one-to-one</span> mentorship
                    <br />
                  </>
                ) : (
                  <>
                    {t("hero.titleComingSoon1")}
                    <br />
                  </>
                )}
                <span className="text-sky-500">{t("hero.titleComingSoon2")}</span>
              </>
            ) : locale === "en" ? (
              <>
                Pick a <span className="text-sky-500">topic.</span> Pick a{" "}
                <span className="text-sky-500">time.</span>
                <br />
                Clear your <span className="text-sky-500">confusions.</span>
              </>
            ) : (
              <>
                {t("hero.title1")}
                <br />
                {t("hero.title2")}
              </>
            )}
          </h1>
          <p className="mx-auto max-w-xl text-base text-slate-500 dark:text-slate-300">
            {comingSoon ? t("hero.subComingSoon") : t("hero.sub")}
          </p>
          {!comingSoon ? (
            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Button variant="primary" size="md" onClick={onPrimaryAction} iconRight={Video}>
                {user ? t("hero.ctaDashboard") : t("hero.ctaBook")}
              </Button>
            </div>
          ) : null}
        </div>

        <div className="relative mt-4 flex w-full flex-1 items-start justify-center overflow-visible sm:mt-5 lg:mt-6">
          <div className="absolute left-0 top-0 hidden lg:block xl:left-4">
            <FeatureCard
              title={t("hero.card1Title")}
              subtitle={t("hero.card1Sub")}
              icon={<Video className="h-4 w-4" />}
              iconPosition="left"
              variant="elevated"
              subtitleColor="text-sky-100"
              className="bg-linear-to-br from-cyan-600 via-sky-500 to-indigo-500 shadow-[0_14px_36px_rgba(14,116,215,0.32)]"
              style={{
                position: "absolute",
                top: "56px",
                left: "130px",
                transform: "rotate(-2.5deg)",
                zIndex: 20,
              }}
            />
            <FeatureCard
              title={t("hero.card2Title")}
              subtitle={t("hero.card2Sub")}
              icon={<BadgeDollarSign className="h-4 w-4" />}
              iconPosition="left"
              variant="default"
              subtitleColor="text-cyan-100"
              className="bg-linear-to-br from-emerald-500 via-teal-500 to-cyan-500 shadow-[0_14px_36px_rgba(13,148,136,0.3)]"
              style={{
                position: "absolute",
                top: "200px",
                left: "90px",
                transform: "rotate(3deg)",
                zIndex: 20,
              }}
            />
          </div>

          <div className="absolute right-0 top-0 hidden lg:block xl:right-4">
            <FeatureCard
              title={t("hero.card3Title")}
              subtitle={t("hero.card3Sub")}
              icon={<CalendarCheck className="h-4 w-4" />}
              iconPosition="right"
              variant="elevated"
              subtitleColor="text-sky-100"
              className="bg-linear-to-br from-violet-600 via-indigo-500 to-blue-500 shadow-[0_14px_36px_rgba(79,70,229,0.32)]"
              style={{
                position: "absolute",
                top: "56px",
                right: "150px",
                transform: "rotate(4deg)",
                zIndex: 20,
              }}
            />
            <FeatureCard
              title={t("hero.card4Title")}
              subtitle={t("hero.card4Sub")}
              icon={<Zap className="h-4 w-4" />}
              iconPosition="right"
              variant="glass"
              subtitleColor="text-cyan-100"
              className="bg-linear-to-br from-fuchsia-500 via-pink-500 to-rose-500 shadow-[0_14px_36px_rgba(236,72,153,0.3)]"
              style={{
                position: "absolute",
                top: "200px",
                right: "90px",
                transform: "rotate(-3deg)",
                zIndex: 20,
              }}
            />
          </div>

          <div className="relative z-10 flex h-80 w-80 items-center justify-center overflow-visible sm:h-[430px] sm:w-[430px] lg:h-[520px] lg:w-[520px]">
            <div className="absolute inset-0 rounded-full border border-sky-200/70 dark:border-sky-300/30" />
            <div className="absolute inset-5 rounded-full border border-sky-200/55 dark:border-sky-300/20" />
            <div className="absolute inset-10 rounded-full bg-linear-to-b from-sky-100/70 via-sky-100/90 to-sky-200 dark:from-sky-900/60 dark:via-sky-900/75 dark:to-slate-900" />
            <Image
              src="/images/hero-img.svg"
              alt="Learner studying with laptop"
              width={400}
              height={460}
              priority
              className="relative z-30 h-[112%] w-auto object-contain drop-shadow-[0_24px_48px_rgba(14,165,233,0.35)]"
            />
            <div className="absolute -left-5 top-16 z-20 rounded-full border border-sky-200 bg-white p-2.5 text-sky-400 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
              <Brain className="h-6 w-6" />
            </div>
            <div className="absolute -right-5 top-16 z-20 rounded-full border border-sky-200 bg-white p-2.5 text-sky-400 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
              <PieChart className="h-6 w-6" />
            </div>
            <div className="absolute -left-3 top-44 z-20 rounded-full border border-sky-200 bg-white p-2.5 text-sky-400 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
              <MousePointerClick className="h-6 w-6" />
            </div>
            <div className="absolute -right-3 top-44 z-20 rounded-full border border-sky-200 bg-white p-2.5 text-sky-400 shadow-[0_4px_18px_-4px_rgba(14,165,233,0.25)] dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300">
              <AlarmClock className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
