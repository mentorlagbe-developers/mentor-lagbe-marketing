"use client";

import Image from "next/image";
import { ArrowRight, CheckCircle2, Video } from "lucide-react";
import { useMemo } from "react";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

type ConfusionClaritySectionProps = {
  title?: string;
  subtitle?: string;
  points?: string[];
};

const pointKeys: MessageKey[] = ["confusion.point1", "confusion.point2", "confusion.point3"];

export function ConfusionClaritySection({
  title,
  subtitle,
  points,
}: ConfusionClaritySectionProps) {
  const t = useT();
  const resolvedTitle = title ?? t("confusion.title");
  const resolvedSubtitle = subtitle ?? t("confusion.sub");
  const resolvedPoints = useMemo(
    () => points ?? pointKeys.map((key) => t(key)),
    [points, t]
  );

  return (
    <section className="bg-slate-50 py-12 transition-colors dark:bg-slate-900 sm:py-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-500">{t("confusion.eyebrow")}</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{resolvedTitle}</h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 sm:text-lg">{resolvedSubtitle}</p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="relative flex items-center justify-center p-2 sm:p-4">
            <div
              className="relative w-full max-w-lg rounded-[30px] border border-white/40 bg-linear-to-br from-white/50 via-sky-100/20 to-white/40 p-1.5 shadow-[0_30px_90px_-36px_rgba(14,165,233,0.45)] backdrop-blur-xl dark:border-white/20 dark:from-slate-800/50 dark:via-sky-950/30 dark:to-slate-800/40"
            >
              <div
                className="pointer-events-none absolute -left-3 -top-3 h-8 w-8 rounded-full border border-white/50 bg-white/30 dark:border-white/30 dark:bg-white/10"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-3 -right-3 h-8 w-8 rounded-full border border-white/50 bg-white/30 dark:border-white/30 dark:bg-white/10"
                aria-hidden
              />
              <div className="relative overflow-hidden rounded-[24px] border border-white/45 bg-white shadow-[0_30px_90px_-36px_rgba(15,23,42,0.7)] dark:border-slate-600/50 dark:bg-slate-900">
                <Image
                  src="/images/solve.jpeg"
                  alt={resolvedTitle}
                  width={640}
                  height={520}
                  className="h-auto w-full rounded-[24px] object-contain"
                />
              </div>
            </div>
          </div>

          <article className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-6 shadow-2xl shadow-sky-500/10 dark:border-slate-700 dark:bg-slate-800">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-600 dark:border-slate-600 dark:bg-slate-700 dark:text-sky-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("confusion.labelClarity")}
              </div>
              <div className="rounded-2xl border border-sky-100 bg-linear-to-br from-white to-sky-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:to-slate-800">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t("confusion.liveSession")}</p>
                  <span className="rounded-full bg-sky-500 px-2 py-0.5 text-xs font-semibold text-white">{t("confusion.active")}</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t("confusion.guiding")}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{t("confusion.fixed")}</p>
                  </div>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {resolvedPoints.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-sky-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
                {t("confusion.aha")}
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
