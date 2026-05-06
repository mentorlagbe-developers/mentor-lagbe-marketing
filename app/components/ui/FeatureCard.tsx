// components/FeatureCard.tsx
import React from "react";
import { cn } from "@/lib/utils"; // or use clsx

export type IconPosition = "left" | "right";

export interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconPosition?: IconPosition;
  accentColor?: string; // Tailwind text color class e.g. "text-cyan-300"
  subtitleColor?: string; // Alias for accentColor (preferred by section usage)
  className?: string;
  style?: React.CSSProperties;
  variant?: "default" | "elevated" | "glass";
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  icon,
  iconPosition = "left",
  accentColor = "text-cyan-300",
  subtitleColor,
  className,
  style,
  variant = "default",
}) => {
  const resolvedSubtitleColor = subtitleColor ?? accentColor;

  const variantStyles = {
    default: `
      bg-gradient-to-br from-[#0ea5e9] via-[#38bdf8] to-[#7dd3fc]
      shadow-[0_8px_32px_rgba(14,165,233,0.35),0_2px_8px_rgba(14,165,233,0.2)]
    `,
    elevated: `
      bg-gradient-to-br from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]
      shadow-[0_16px_48px_rgba(2,132,199,0.4),0_4px_16px_rgba(2,132,199,0.25)]
    `,
    glass: `
      bg-gradient-to-br from-[#0369a1] via-[#0ea5e9] to-[#22d3ee]
      border border-sky-200/45
      shadow-[0_14px_40px_rgba(2,132,199,0.4),0_4px_14px_rgba(14,165,233,0.28)]
    `,
  };

  return (
    <div
      className={cn(
        // Base layout
        "relative flex items-start gap-3 rounded-2xl px-5 py-4 w-[220px]",
        // 3D depth
        "before:absolute before:inset-0 before:rounded-2xl before:bg-white/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        "after:absolute after:bottom-[-6px] after:left-[8%] after:right-[8%] after:h-[6px] after:rounded-b-xl",
        "after:bg-linear-to-b after:from-sky-700/40 after:to-transparent after:blur-sm",
        // Transform / 3D
        "transform-gpu transition-transform duration-300 ease-out feature-float will-change-transform",
        "hover:-translate-y-1 hover:scale-[1.02]",
        "hover:shadow-[0_20px_60px_rgba(14,165,233,0.45),0_6px_20px_rgba(14,165,233,0.3)]",
        // Perspective tilt on hover via CSS vars
        "transform-3d",
        variantStyles[variant],
        className
      )}
      style={style}
    >
      {/* Specular highlight */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-b from-white/25 to-transparent" />

      {/* Icon — left side */}
      {iconPosition === "left" && (
        <div className="relative z-10 mt-0.5 shrink-0 rounded-xl bg-white/20 p-2 text-white shadow-inner">
          {icon}
        </div>
      )}

      {/* Text content */}
      <div className="relative z-10 flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-semibold leading-snug text-white drop-shadow-sm">
          {title}
        </span>
        <span className={cn("text-[11px] font-medium leading-snug", resolvedSubtitleColor)}>
          {subtitle}
        </span>
      </div>

      {/* Icon — right side */}
      {iconPosition === "right" && (
        <div className="relative z-10 mt-0.5 ml-auto shrink-0 rounded-xl bg-white/20 p-2 text-white shadow-inner">
          {icon}
        </div>
      )}
    </div>
  );
};

export default FeatureCard;