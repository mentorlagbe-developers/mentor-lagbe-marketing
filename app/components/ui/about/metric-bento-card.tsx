import type { GrowthMetric } from "@/app/sections/about/about-data";

type MetricBentoCardProps = {
  item: GrowthMetric;
  featured?: boolean;
};

export function MetricBentoCard({ item, featured = false }: MetricBentoCardProps) {
  return (
    <article
      className={`rounded-2xl border p-5 ${
        featured
          ? "border-sky-400/40 bg-linear-to-br from-sky-600 to-indigo-600 text-white"
          : "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      }`}
    >
      <p
        className={`text-xs uppercase tracking-[0.15em] ${
          featured ? "text-sky-100" : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {item.label}
      </p>
      <p className="mt-2 text-3xl font-bold">{item.value}</p>
      <p className={`mt-2 text-sm ${featured ? "text-sky-100" : "text-slate-600 dark:text-slate-300"}`}>
        {item.detail}
      </p>
    </article>
  );
}
