import { LoaderCircle } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
  loading?: boolean;
}

export function Button({ className, variant = "primary", size = "md", loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-bold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#1f6a4a] text-white hover:bg-[#18593e]",
        variant === "secondary" && "border border-[#d7dbd7] bg-white text-[#26302b] hover:bg-[#f4f5f2]",
        variant === "ghost" && "text-[#53605a] hover:bg-[#e9ebe7]",
        variant === "danger" && "bg-[#fff0ef] text-[#a62f2b] hover:bg-[#f9dfdd]",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-11 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <LoaderCircle size={16} className="animate-spin" />}
      {children}
    </button>
  );
}
