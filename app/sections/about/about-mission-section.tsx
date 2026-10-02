"use client";

import Image from "next/image";
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
  topBorderClass: string;
  titleKey: MessageKey;
  descKey: MessageKey;
}> = [
  {
    id: "impact",
    icon: Target,
    accentClass: "from-sky-500/20 to-indigo-500/20 text-sky-600 dark:text-sky-300",
    topBorderClass: "border-t-sky-500 dark:border-t-sky-400",
    titleKey: "about.value.impact.title",
    descKey: "about.value.impact.desc",
  },
  {
    id: "accessibility",
    icon: HeartHandshake,
    accentClass: "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-300",
    topBorderClass: "border-t-emerald-500 dark:border-t-emerald-400",
    titleKey: "about.value.accessibility.title",
    descKey: "about.value.accessibility.desc",
  },
  {
    id: "personalized-growth",
    icon: Sparkles,
    accentClass: "from-violet-500/20 to-fuchsia-500/20 text-violet-600 dark:text-violet-300",
    topBorderClass: "border-t-violet-500 dark:border-t-violet-400",
    titleKey: "about.value.personalized.title",
    descKey: "about.value.personalized.desc",
  },
  {
    id: "mentor-quality",
    icon: BookOpenCheck,
    accentClass: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300",
    topBorderClass: "border-t-amber-500 dark:border-t-amber-400",
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
        topBorderClass: item.topBorderClass,
      })),
    [t]
  );

  return (
    <section className="bg-slate-50 py-14 dark:bg-slate-900/60 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <SectionHeading
            eyebrow={t("about.mission.eyebrow")}
            title={t("about.mission.title")}
            description={t("about.mission.description")}
            centered
          />
        </motion.div>

        <div className="mt-10 grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative min-h-[240px] overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:min-h-[280px] lg:min-h-0 lg:h-full"
          >
            <Image
              src="/about/mission.jpg"
              alt={t("about.mission.imageCaption")}
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </motion.div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:content-stretch">
            {values.map((item, index) => (
              <motion.div
                key={item.id}
                className="h-full min-h-0"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
              >
                <ValueCard item={item} className="h-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
