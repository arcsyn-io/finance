import type { CategoryType } from "./category";

export const defaultCategoryIcon = "Tag";

export const incomeCategoryColors = [
  { id: "green", label: "Verde", value: "oklch(0.72 0.13 158)" },
  { id: "emerald", label: "Esmeralda", value: "oklch(0.76 0.11 170)" },
  { id: "teal", label: "Teal", value: "oklch(0.75 0.10 190)" },
  { id: "cyan", label: "Ciano", value: "oklch(0.74 0.09 210)" },
  { id: "blue", label: "Azul", value: "oklch(0.68 0.07 235)" },
  { id: "indigo", label: "Indigo", value: "oklch(0.65 0.12 260)" },
  { id: "violet", label: "Violeta", value: "oklch(0.72 0.12 290)" },
  { id: "slate", label: "Cinza", value: "oklch(0.68 0.018 250)" },
] as const;

export const expenseCategoryColors = [
  { id: "red", label: "Vermelho", value: "oklch(0.66 0.19 24)" },
  { id: "crimson", label: "Carmim", value: "oklch(0.60 0.20 15)" },
  { id: "orange", label: "Laranja", value: "oklch(0.72 0.15 50)" },
  { id: "amber", label: "Ambar", value: "oklch(0.79 0.13 78)" },
  { id: "yellow", label: "Amarelo", value: "oklch(0.82 0.12 95)" },
  { id: "rose", label: "Rosa", value: "oklch(0.72 0.15 345)" },
  { id: "pink", label: "Magenta", value: "oklch(0.72 0.17 320)" },
  { id: "slate", label: "Cinza", value: "oklch(0.68 0.018 250)" },
] as const;

export const categoryIconIds = [
  "Tag",
  "ShoppingCart",
  "Briefcase",
  "Users",
  "Home",
  "Package",
  "TrendingUp",
  "TrendingDown",
  "DollarSign",
  "Receipt",
  "PiggyBank",
  "Wallet",
  "CreditCard",
  "Building2",
  "Factory",
  "Truck",
  "Zap",
  "Globe",
  "Monitor",
  "Smartphone",
  "Wrench",
  "Car",
  "Plane",
  "Coffee",
  "Utensils",
  "Heart",
  "Shield",
  "BookOpen",
  "Percent",
  "Star",
] as const;

export type CategoryIconId = (typeof categoryIconIds)[number];

export function defaultCategoryColor(type: CategoryType): string {
  return type === "INCOME"
    ? incomeCategoryColors[0].value
    : expenseCategoryColors[0].value;
}

export function normalizeCategoryIcon(icon: string | undefined): string {
  return icon && categoryIconIds.includes(icon as CategoryIconId)
    ? icon
    : defaultCategoryIcon;
}

export function normalizeCategoryColor(
  color: string | undefined,
  type: CategoryType,
): string {
  return color?.trim() || defaultCategoryColor(type);
}
