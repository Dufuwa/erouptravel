import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "green" | "amber" | "red" | "blue"; className?: string }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
      tone === "neutral" && "bg-[#eceeeb] text-[#58625d]",
      tone === "green" && "bg-[#dcece3] text-[#1f6a4a]",
      tone === "amber" && "bg-[#fff0d6] text-[#8b5514]",
      tone === "red" && "bg-[#f9dfdd] text-[#a62f2b]",
      tone === "blue" && "bg-[#e3edf6] text-[#32607f]",
      className,
    )}>{children}</span>
  );
}
