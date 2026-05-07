import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  // Using LucideIcon type allows passing the component itself
  iconLeft?: LucideIcon;
  iconRight?: LucideIcon;
  children?: ReactNode;
};

const variantClasses = {
  primary:
    "bg-brand-primary text-white shadow-xl shadow-brand-primary/30 hover:bg-brand-secondary hover:shadow-brand-secondary/40 hover:-translate-y-0.5 active:translate-y-0",
  secondary:
    "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-sky-200 hover:text-sky-600 hover:shadow-md",
  ghost: 
    "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

const sizeClasses = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const iconSizeClasses = {
  sm: "size-4",
  md: "size-4",
  lg: "size-5",
};

export function Button({
  className,
  children,
  variant = "primary",
  size = "md",
  iconLeft: IconLeft,
  iconRight: IconRight,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center shadow-2xl gap-2 rounded-xl font-semibold transition-all duration-200",
        "disabled:cursor-not-allowed disabled:opacity-60",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {IconLeft && <IconLeft className={cn(iconSizeClasses[size], "shrink-0")} />}
      
      {/* Only render span if children exist to maintain spacing */}
      {children && <span>{children}</span>}
      
      {IconRight && <IconRight className={cn(iconSizeClasses[size], "shrink-0")} />}
    </button>
  );
}