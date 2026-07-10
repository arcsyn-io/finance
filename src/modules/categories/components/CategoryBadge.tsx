import {
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Coffee,
  CreditCard,
  DollarSign,
  Factory,
  Globe,
  Heart,
  Home,
  Monitor,
  Package,
  Percent,
  PiggyBank,
  Plane,
  Receipt,
  Shield,
  ShoppingCart,
  Smartphone,
  Star,
  Tag,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  Utensils,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  categoryIconIds,
  defaultCategoryIcon,
} from "@/domain/category/category-visual";

export const categoryIconMap: Record<string, LucideIcon> = {
  Tag,
  ShoppingCart,
  Briefcase,
  Users,
  Home,
  Package,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  PiggyBank,
  Wallet,
  CreditCard,
  Building2,
  Factory,
  Truck,
  Zap,
  Globe,
  Monitor,
  Smartphone,
  Wrench,
  Car,
  Plane,
  Coffee,
  Utensils,
  Heart,
  Shield,
  BookOpen,
  Percent,
  Star,
};

export const categoryIconOptions = categoryIconIds.map((id) => ({
  id,
  Icon: categoryIconMap[id],
}));

const fallbackColor = "oklch(0.68 0.018 250)";

function colorWithAlpha(color: string | undefined) {
  const resolvedColor = color ?? fallbackColor;

  return resolvedColor.startsWith("oklch(")
    ? resolvedColor.replace(")", " / 0.14)")
    : resolvedColor;
}

export function CategoryBadge({
  color,
  icon,
  name,
}: {
  readonly color: string;
  readonly icon: string;
  readonly name: string;
}) {
  const resolvedColor = color ?? fallbackColor;
  const Icon = categoryIconMap[icon ?? defaultCategoryIcon] ?? Tag;

  return (
    <span
      className="inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: colorWithAlpha(color), color: resolvedColor }}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{name}</span>
    </span>
  );
}
