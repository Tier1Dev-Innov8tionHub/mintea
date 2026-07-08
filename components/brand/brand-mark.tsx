import { Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({
  size = "md",
  stacked = false,
  className,
}: {
  size?: "sm" | "md" | "lg" | "hero";
  stacked?: boolean;
  className?: string;
}) {
  const iconSize = {
    sm: "h-5 w-5",
    md: "h-7 w-7",
    lg: "h-9 w-9",
    hero: "h-14 w-14",
  }[size];

  const textSize = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    hero: "text-5xl",
  }[size];

  return (
    <div
      className={cn(
        "flex items-center text-white",
        stacked ? "flex-col gap-3" : "gap-2",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full border-2 border-white/90",
          size === "hero" ? "h-20 w-20" : size === "lg" ? "h-12 w-12" : "h-9 w-9",
        )}
      >
        <Leaf className={cn(iconSize, "stroke-[1.75]")} />
      </div>
      <span className={cn("font-bold tracking-tight", textSize)}>mintea</span>
    </div>
  );
}
