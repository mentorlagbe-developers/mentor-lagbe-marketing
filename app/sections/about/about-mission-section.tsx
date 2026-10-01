"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpenCheck, HeartHandshake, Sparkles, Target } from "lucide-react";
import { SectionHeading } from "@/app/components/ui/about/section-heading";
import { ValueCard } from "@/app/components/ui/about/value-card";
import type { AboutValue } from "@/app/sections/about/about-data";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

const VALUE_DEFS: Array<{
  id: string;
  icon: typeof Target;
  accentClass: string;
  titleKey: MessageKey;
  descKey: MessageKey;
}> = [
  {
    id: "impact",
    icon: Target,
    accentClass: "from-sky-500/15 to-indigo-500/15 text-sky-600 dark:text-sky-300",
    titleKey: "about.value.impact.title",
    descKey: "about.value.impact.desc",
  },
  {
    id: "accessibility",
    icon: HeartHandshake,
    accentClass: "from-emerald-500/15 to-teal-500/15 text-emerald-600 dark:text-emerald-300",
    titleKey: "about.value.accessibility.title",
    descKey: "about.value.accessibility.desc",
  },
  {
    id: "personalized-growth",
    icon: Sparkles,
    accentClass: "from-violet-500/15 to-fuchsia-500/15 text-violet-600 dark:text-violet-300",
    titleKey: "about.value.personalized.title",
    descKey: "about.value.personalized.desc",
  },
  {
    id: "mentor-quality",
    icon: BookOpenCheck,
    accentClass: "from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-300",
    titleKey: "about.value.quality.title",
    descKey: "about.value.quality.desc",
  },
];

export function AboutMissionSection() {
  const t = useT();

  const values = useMemo<AboutValue[]>(
    () =>
      VALUE_DEFS.map((item) => ({
        id: item.id,
        title: t(item.titleKey),
        description: t(item.descKey),
        icon: item.icon,
        accentClass: item.accentClass,
      })),
    [t]
  );

  return (
    <section className="bg-slate-50 py-14 dark:bg-slate-900/60 sm:py-16">
      <div className="mx-auto grid w-full max-w-7xl items-start gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.22),transparent_45%),radial-gradient(circle_at_80%_90%,rgba(16,185,129,0.2),transparent_46%)]" />
          <div className="relative h-[320px] rounded-2xl border border-white/60 bg-linear-to-br from-slate-200 via-sky-100 to-emerald-100 dark:border-slate-700 dark:from-slate-800 dark:via-sky-900/40 dark:to-emerald-900/30" />
          <p className="relative mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            {t("about.mission.imageCaption")}
          </p>
        </motion.div>

        <div>
          <SectionHeading
            eyebrow={t("about.mission.eyebrow")}
            title={t("about.mission.title")}
            description={t("about.mission.description")}
          />
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {values.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
              >
                <ValueCard item={item} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
