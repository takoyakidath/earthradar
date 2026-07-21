import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
type Size = "sm" | "md" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-brand text-text-inverse hover:bg-brand-strong active:bg-brand-strong shadow-xs",
  secondary:
    "bg-surface-hover text-text-primary hover:bg-border border border-border",
  outline:
    "bg-transparent text-text-primary border border-border-strong hover:bg-surface-hover",
  ghost: "bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary",
  destructive: "bg-danger text-white hover:opacity-90 shadow-xs",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  icon: "h-9 w-9 p-0 justify-center",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-md font-medium
        transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none
        cursor-pointer ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
}
