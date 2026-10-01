"use client";

import { PlayCircle, Radio, Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { isComingSoonMode } from "@/lib/coming-soon";
import {
  getFacebookUrl,
  getYoutubeUrl,
  isExternalSocialUrl,
} from "@/lib/social-links";

const cards = [
  {
    icon: PlayCircle,
    title: "Recorded courses",
    description: "Watch topic-based lessons on our YouTube channel at your own pace.",
    getHref: getYoutubeUrl,
    cta: "Watch on YouTube",
  },
  {
    icon: Users,
    title: "Free live sessions",
    description: "Join free Q&A and multi-topic lives on Facebook—ask questions in real time.",
    getHref: getFacebookUrl,
    cta: "Follow on Facebook",
  },
  {
    icon: Radio,
    title: "Live courses",
    description: "Structured live batches and workshops announced on Facebook and YouTube.",
    getHref: getFacebookUrl,
    cta: "Get updates",
  },
] as const;

export function InterimLearningSection() {
  const comingSoon = isComingSoonMode();

  return (
    <section
      id="learn-now"
      className="scroll-mt-24 border-t border-slate-100 bg-slate-50/80 px-4 py-14 dark:border-slate-800 dark:bg-slate-900/40 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            Learn with us <span className="text-sky-500">today</span>
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
            While we finish the one-to-one booking platform, we are publishing courses and hosting
            free lives—you do not need an account.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {cards.map((card) => {
            const href = card.getHref();
            const external = isExternalSocialUrl(href);
            return (
              <article
                key={card.title}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <card.icon className="h-9 w-9 text-sky-500" aria-hidden />
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {card.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {card.description}
                </p>
                {/* CTA_HIDDEN — card link buttons until full launch (or when social URLs are set) */}
                {!comingSoon && external ? (
                  <div className="mt-5">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
                    >
                      {card.cta}
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
