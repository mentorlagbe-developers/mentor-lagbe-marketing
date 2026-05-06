import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type BadgePillProps = {
  children: ReactNode;
  icon?: LucideIcon;
  variant?: "outline" | "sky" | "green" | "amber";
  className?: string;
};

const variantClasses = {
  outline:
    "border border-slate-200 bg-white text-slate-600 shadow-sm",
  sky:
    "border border-sky-200 bg-sky-50 text-sky-600",
  green:
    "border border-emerald-200 bg-emerald-50 text-emerald-600",
  amber:
    "border border-amber-200 bg-amber-50 text-amber-600",
};

export function BadgePill({
  children,
  icon: Icon,
  variant = "outline",
  className,
}: BadgePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </span>
  );
}
