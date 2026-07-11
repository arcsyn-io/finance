"use client";

import { useCallback, useMemo, useState } from "react";
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
  readonly selectedValues: readonly string[];
};

export function CategorySelect({
  categories,
  disabled = false,
  label = "Categoria",
  mode = "multiple",
  onChange,
  selectedValues,
}: CategorySelectProps) {
  const [options, setOptions] = useState(() =>
    categories.map(categoryToSelectOption),
  );

  const selectedOptions = useMemo(
    () => options.filter((option) => selectedValues.includes(option.value)),
    [options, selectedValues],
  );

  const searchCategories = useCallback(async (searchText: string) => {
    const params = new URLSearchParams();
    params.set("search", searchText);
    params.set("limit", "10");

    const response = await fetch(`/api/categories?${params.toString()}`);
    const body = (await response.json()) as CategoryApiResponse;

    if (!response.ok) {
      throw new Error(body.error ?? "Nao foi possivel buscar categorias");
    }

    const nextOptions = (body.categories ?? []).map(categoryToSelectOption);
    setOptions((current) => mergeFilterOptions(current, nextOptions));

    return nextOptions;
  }, []);

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
      selectedValues={selectedValues}
    />
  );
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
