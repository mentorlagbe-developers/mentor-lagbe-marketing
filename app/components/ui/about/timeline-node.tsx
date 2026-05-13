import type { JourneyMilestone } from "@/app/sections/about/about-data";

type TimelineNodeProps = {
  item: JourneyMilestone;
};

export function TimelineNode({ item }: TimelineNodeProps) {
  return (
    <article className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
        {item.year}
      </span>
      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {item.title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {item.description}
      </p>
    </article>
  );
}
