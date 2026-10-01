"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/app/components/ui/about/section-heading";
import { TimelineNode } from "@/app/components/ui/about/timeline-node";
import type { JourneyMilestone } from "@/app/sections/about/about-data";
import { useT } from "@/lib/locale/locale-provider";
import type { MessageKey } from "@/lib/locale/messages";

const MILESTONE_DEFS: Array<{
  id: string;
  yearKey: MessageKey;
  titleKey: MessageKey;
  descKey: MessageKey;
}> = [
  {
    id: "spark",
    yearKey: "about.journey.m1.year",
    titleKey: "about.journey.m1.title",
    descKey: "about.journey.m1.desc",
  },
  {
    id: "build",
    yearKey: "about.journey.m2.year",
    titleKey: "about.journey.m2.title",
    descKey: "about.journey.m2.desc",
  },
  {
    id: "today",
    yearKey: "about.journey.m3.year",
    titleKey: "about.journey.m3.title",
    descKey: "about.journey.m3.desc",
  },
  {
    id: "mentorship",
    yearKey: "about.journey.m4.year",
    titleKey: "about.journey.m4.title",
    descKey: "about.journey.m4.desc",
  },
];

export function AboutTimelineSection() {
  const t = useT();

  const milestones = useMemo<JourneyMilestone[]>(
    () =>
      MILESTONE_DEFS.map((item) => ({
        id: item.id,
        year: t(item.yearKey),
        title: t(item.titleKey),
        description: t(item.descKey),
      })),
    [t]
  );

  return (
    <section className="bg-white py-14 dark:bg-slate-950 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow={t("about.journey.eyebrow")}
          title={t("about.journey.title")}
          description={t("about.journey.sub")}
          centered
        />
        <div className="relative mx-auto mt-10 max-w-4xl">
          <div className="absolute left-4 top-2 hidden h-[calc(100%-20px)] w-0.5 bg-linear-to-b from-sky-300 to-indigo-300 dark:from-sky-700 dark:to-indigo-700 sm:block" />
          <div className="space-y-4">
            {milestones.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.22 }}
                transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
                className="relative sm:pl-12"
              >
                <span className="absolute left-[0.35rem] top-8 hidden h-3 w-3 rounded-full bg-sky-500 shadow-[0_0_0_5px_rgba(14,165,233,0.16)] sm:block" />
                <TimelineNode item={item} />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
