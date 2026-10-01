"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Clock, UserRound } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { FeaturePoint } from "@/app/components/ui/feature-point";
import { useLocale, useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

type LiveSupportSectionProps = {
  comingSoon?: boolean;
  onCtaClick?: () => void;
};

const featureKeys: Array<{
  icon: typeof UserRound;
  titleKey: MessageKey;
  descKey: MessageKey;
}> = [
  {
    icon: UserRound,
    titleKey: "live.feature1Title",
    descKey: "live.feature1Desc",
  },
  {
    icon: BadgeCheck,
    titleKey: "live.feature2Title",
    descKey: "live.feature2Desc",
  },
  {
    icon: Clock,
    titleKey: "live.feature3Title",
    descKey: "live.feature3Desc",
  },
];

export function LiveSupportSection({ comingSoon = false, onCtaClick }: LiveSupportSectionProps) {
  const t = useT();
  const { locale } = useLocale();
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
      className="relative overflow-hidden bg-white py-12 transition-colors dark:bg-slate-950 sm:py-12 lg:py-14"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(186,230,255,0.18),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(14,116,144,0.22),transparent)]" />

      <div
        className={`mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 scroll-reveal ${isVisible ? "is-visible" : ""}`}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute left-0 top-0 z-10 flex items-center gap-1.5">
            <span className="flex h-2 w-2 rounded-full bg-sky-500" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {t("live.badge")}
            </span>
          </div>

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

        <div className="flex flex-col items-start gap-6">
          <div>
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-slate-950 dark:text-white sm:text-4xl lg:text-5xl">
              {locale === "en" ? (
                <>
                  Get <span className="text-sky-500">unstuck</span>
                  <br />
                  Get <span className="text-sky-500">expert help!</span>
                </>
              ) : (
                <>
                  {t("live.title1")}
                  <br />
                  {t("live.title2")}
                </>
              )}
            </h2>
          </div>

          <div className="space-y-1 text-base text-slate-600 dark:text-slate-300 sm:text-[1.05rem]">
            <p>{t("live.line1")}</p>
            <p>{t("live.line2")}</p>
          </div>

          <div className="flex w-full flex-col gap-4">
            {featureKeys.map((f) => (
              <FeaturePoint
                key={f.titleKey}
                icon={f.icon}
                title={t(f.titleKey)}
                description={t(f.descKey)}
              />
            ))}
          </div>

          {!comingSoon ? (
            <div className="mt-2 w-full">
              <Button
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                onClick={onCtaClick}
                className="h-14 w-full rounded-xl text-sm font-bold uppercase tracking-widest"
              >
                {t("live.cta")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
