import type { HTMLAttributes, ReactNode } from "react";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-surface-hover text-text-secondary border-border",
  brand: "bg-brand-soft text-brand-strong border-transparent",
  success: "bg-success-soft text-success border-transparent",
  warning: "bg-warning-soft text-warning border-transparent",
  danger: "bg-danger-soft text-danger border-transparent",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
}

export function Badge({ tone = "neutral", icon, className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs
        font-medium leading-none whitespace-nowrap ${toneClasses[tone]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
}

/** A badge whose color comes from the震度 severity scale rather than a fixed tone. */
export function SeverityBadge({
  label,
  color,
  foreground,
  size = "md",
  className = "",
}: {
  label: string;
  color: string;
  foreground: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses =
    size === "lg"
      ? "h-14 w-14 text-lg"
      : size === "sm"
        ? "h-7 w-7 text-[11px]"
        : "h-10 w-10 text-sm";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold
        tabular-nums shadow-xs ring-1 ring-black/5 ${sizeClasses} ${className}`}
      style={{ backgroundColor: color, color: foreground }}
      aria-hidden
    >
      {label}
    </span>
  );
}
