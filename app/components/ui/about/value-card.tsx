import type { AboutValue } from "@/app/sections/about/about-data";

type ValueCardProps = {
  item: AboutValue;
};

export function ValueCard({ item }: ValueCardProps) {
  const Icon = item.icon;

  return (
    <article className="group rounded-2xl border border-slate-200 bg-white/85 p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80">
      <div className={`inline-flex rounded-xl bg-linear-to-br p-2.5 ${item.accentClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {item.title}
      </h3>
      <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {item.description}
      </p>
    </article>
  );
}
