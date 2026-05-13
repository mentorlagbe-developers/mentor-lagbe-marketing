"use client";

import { motion } from "framer-motion";
import { MetricBentoCard } from "@/app/components/ui/about/metric-bento-card";
import type { GrowthMetric } from "@/app/sections/about/about-data";

type AboutGrowthMetricsSectionProps = {
  metrics: GrowthMetric[];
};

export function AboutGrowthMetricsSection({ metrics }: AboutGrowthMetricsSectionProps) {
  return (
    <section className="bg-white py-14 transition-colors dark:bg-slate-950 sm:py-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-300">
            Growth Metrics
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Built on Outcomes, Not Claims
          </h2>
          <p className="mt-3 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Transparent numbers that reflect student trust and mentor impact.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
            >
              <MetricBentoCard item={item} featured={index === 0} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
