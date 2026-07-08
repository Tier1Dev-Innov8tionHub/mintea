"use client";

import {
  Utensils,
  ShoppingCart,
  ShoppingBag,
  Car,
  Film,
  HeartPulse,
  Home,
  Repeat,
  Briefcase,
  Laptop,
  PiggyBank,
  ArrowLeftRight,
  Umbrella,
  Palmtree,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  utensils: Utensils,
  "shopping-cart": ShoppingCart,
  "shopping-bag": ShoppingBag,
  car: Car,
  film: Film,
  "heart-pulse": HeartPulse,
  home: Home,
  repeat: Repeat,
  briefcase: Briefcase,
  laptop: Laptop,
  "piggy-bank": PiggyBank,
  "arrow-left-right": ArrowLeftRight,
  umbrella: Umbrella,
  palmtree: Palmtree,
};

interface CategoryIconProps {
  icon: string;
  color?: string;
  size?: number;
  className?: string;
}

export function CategoryIcon({ icon, color = "#059669", size = 20, className }: CategoryIconProps) {
  const Icon = ICON_MAP[icon] ?? HelpCircle;
  return (
    <div
      className={`flex items-center justify-center rounded-full ${className}`}
      style={{ backgroundColor: `${color}20`, width: size + 16, height: size + 16 }}
    >
      <Icon size={size} style={{ color }} />
    </div>
  );
}

export function GoalIcon({
  icon,
  size = 20,
  className = "text-emerald-600",
}: {
  icon: string;
  size?: number;
  className?: string;
}) {
  const Icon = ICON_MAP[icon] ?? PiggyBank;
  return <Icon size={size} className={className} />;
}
