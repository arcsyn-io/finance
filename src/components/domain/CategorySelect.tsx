"use client";

import { useCallback, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Category } from "@/domain/category/category";
import {
  FilterSelect,
  type FilterSelectOption,
} from "@/components/ui/FilterSelect";
import { CategoryBadge } from "@/modules/categories/components/CategoryBadge";

type CategoryApiResponse = {
  readonly categories?: Category[];
  readonly error?: string;
};

type CategorySelectProps = {
  readonly categories: readonly Category[];
  readonly disabled?: boolean;
  readonly label?: string;
  readonly mode?: "single" | "multiple";
  readonly onChange: (values: string[]) => void;
  readonly selectedColor?: string | null;
  readonly selectedValues: readonly string[];
  readonly triggerClassName?: string;
};

export function CategorySelect({
  categories,
  disabled = false,
  label = "Categoria",
  mode = "multiple",
  onChange,
  selectedColor,
  selectedValues,
  triggerClassName,
}: CategorySelectProps) {
  const queryClient = useQueryClient();
  const [remoteOptions, setRemoteOptions] = useState<
    readonly FilterSelectOption<string>[]
  >([]);
  const localOptions = useMemo(
    () => categories.map(categoryToSelectOption),
    [categories],
  );
  const options = useMemo(
    () => mergeFilterOptions(localOptions, remoteOptions),
    [localOptions, remoteOptions],
  );

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues],
  );
  const selectedCategory = categories.find((category) =>
    selectedValues.includes(category.id),
  );
  const highlightColor = selectedColor ?? selectedCategory?.color ?? null;

  const searchCategories = useCallback(
    async (searchText: string) => {
      const normalizedSearch = normalizeSearchText(searchText);
      const localMatches = filterCategoryOptions(localOptions, normalizedSearch);

      if (localMatches.length > 0 || normalizedSearch.length === 0) {
        return localMatches.slice(0, 10);
      }

      const categoriesFromApi = await queryClient.fetchQuery({
        queryKey: [
          "categories",
          "search",
          { includeInactive: false, limit: 10, search: normalizedSearch },
        ],
        queryFn: () => fetchCategories(normalizedSearch, 10),
        staleTime: 5 * 60 * 1000,
      });
      const nextOptions = categoriesFromApi.map(categoryToSelectOption);
      setRemoteOptions((current) => mergeFilterOptions(current, nextOptions));

      return nextOptions;
    },
    [localOptions, queryClient],
  );

  return (
    <FilterSelect
      label={label}
      disabled={disabled}
      mode={mode}
      onChange={onChange}
      options={options}
      search={{
        emptyLabel: "Nenhuma categoria encontrada",
        errorLabel: "Nao foi possivel buscar categorias",
        loadOptions: searchCategories,
        loadingLabel: "Buscando categorias...",
        placeholder: "Buscar categoria",
      }}
      selectedOptions={selectedOptions}
      selectedTriggerStyle={
        highlightColor
          ? {
              backgroundColor: colorWithAlpha(highlightColor),
              borderColor: colorWithAlpha(highlightColor, 0.42),
              color: highlightColor,
            }
          : undefined
      }
      selectedValues={selectedValues}
      triggerClassName={triggerClassName}
    />
  );
}

async function fetchCategories(
  searchText: string,
  limit: number,
): Promise<readonly Category[]> {
  const params = new URLSearchParams();
  params.set("search", searchText);
  params.set("limit", String(limit));

  const response = await fetch(`/api/categories?${params.toString()}`);
  const body = (await response.json()) as CategoryApiResponse;

  if (!response.ok) {
    throw new Error(body.error ?? "Nao foi possivel buscar categorias");
  }

  return body.categories ?? [];
}

export function categoryToSelectOption(
  category: Category,
): FilterSelectOption<string> {
  return {
    value: category.id,
    label: category.name,
    content: (
      <CategoryBadge
        color={category.color}
        icon={category.icon}
        name={category.name}
      />
    ),
  };
}

function mergeFilterOptions(
  current: readonly FilterSelectOption<string>[],
  next: readonly FilterSelectOption<string>[],
): FilterSelectOption<string>[] {
  const options = new Map<string, FilterSelectOption<string>>();

  for (const option of current) {
    options.set(option.value, option);
  }

  for (const option of next) {
    options.set(option.value, option);
  }

  return [...options.values()];
}

function filterCategoryOptions(
  options: readonly FilterSelectOption<string>[],
  normalizedSearch: string,
): FilterSelectOption<string>[] {
  if (!normalizedSearch) return [...options];

  return options.filter((option) =>
    normalizeSearchText(option.label).includes(normalizedSearch),
  );
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function colorWithAlpha(color: string, alpha = 0.14) {
  return color.startsWith("oklch(")
    ? color.replace(")", ` / ${alpha})`)
    : color;
}
