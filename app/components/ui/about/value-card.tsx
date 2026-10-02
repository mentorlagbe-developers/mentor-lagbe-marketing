import type { AboutValue } from "@/app/sections/about/about-data";
import { cn } from "@/lib/utils";

type ValueCardProps = {
  item: AboutValue;
  className?: string;
};

export function ValueCard({ item, className }: ValueCardProps) {
  const Icon = item.icon;

  return (
    <article
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-slate-200 border-t-4 bg-white/85 p-4 transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/80",
        item.topBorderClass ?? "border-t-sky-500 dark:border-t-sky-400",
        className
      )}
    >
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl bg-linear-to-br",
          item.accentClass
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
        {item.title}
      </h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
        {item.description}
      </p>
    </article>
  );
}
