"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/app/components/ui/about/section-heading";
import { TimelineNode } from "@/app/components/ui/about/timeline-node";
import type { JourneyMilestone } from "@/app/sections/about/about-data";

type AboutTimelineSectionProps = {
  milestones: JourneyMilestone[];
};

export function AboutTimelineSection({ milestones }: AboutTimelineSectionProps) {
  return (
    <section className="bg-white py-14 dark:bg-slate-950 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="The Journey"
          title="How We Built Mentor Lagbe"
          description="A learner-first timeline of progress, iteration, and impact."
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
