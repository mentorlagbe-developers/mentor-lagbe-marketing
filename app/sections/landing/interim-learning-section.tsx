"use client";

import { PlayCircle, Radio, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { isComingSoonMode } from "@/lib/coming-soon";
import {
  getFacebookUrl,
  getYoutubeUrl,
  isExternalSocialUrl,
} from "@/lib/social-links";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

const cardMeta: Array<{
  icon: typeof PlayCircle;
  titleKey: MessageKey;
  descKey: MessageKey;
  ctaKey: MessageKey;
  getHref: () => string;
}> = [
  {
    icon: PlayCircle,
    titleKey: "interim.card1Title",
    descKey: "interim.card1Desc",
    ctaKey: "interim.card1Cta",
    getHref: getYoutubeUrl,
  },
  {
    icon: Users,
    titleKey: "interim.card2Title",
    descKey: "interim.card2Desc",
    ctaKey: "interim.card2Cta",
    getHref: getFacebookUrl,
  },
  {
    icon: Radio,
    titleKey: "interim.card3Title",
    descKey: "interim.card3Desc",
    ctaKey: "interim.card3Cta",
    getHref: getFacebookUrl,
  },
];

export function InterimLearningSection() {
  const t = useT();
  const comingSoon = isComingSoonMode();

  return (
    <section
      id="learn-now"
      className="scroll-mt-24 border-t border-slate-100 bg-slate-50/80 px-4 py-14 dark:border-slate-800 dark:bg-slate-900/40 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            {t("interim.heading")}
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">{t("interim.sub")}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cardMeta.map((card) => {
            const href = card.getHref();
            const external = isExternalSocialUrl(href);
            const Icon = card.icon;
            return (
              <article
                key={card.titleKey}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <Icon className="h-9 w-9 text-sky-500" aria-hidden />
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {t(card.titleKey)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {t(card.descKey)}
                </p>
                {!comingSoon && external ? (
                  <div className="mt-5">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
                    >
                      {t(card.ctaKey)}
                    </Button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
