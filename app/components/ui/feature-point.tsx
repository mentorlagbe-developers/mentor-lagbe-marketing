import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type FeaturePointProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  iconClassName?: string;
  className?: string;
};

export function FeaturePoint({
  icon: Icon,
  title,
  description,
  iconClassName,
  className,
}: FeaturePointProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-200 bg-sky-50 text-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-sky-300",
          iconClassName
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-sky-500">{title}</p>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">{description}</p>
      </div>
    </div>
  );
}
