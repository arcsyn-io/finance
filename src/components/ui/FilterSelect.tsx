"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";

export type FilterSelectOption<TValue extends string> = {
  readonly value: TValue;
  readonly label: string;
  readonly content?: ReactNode;
};

export type FilterSelectMode = "single" | "multiple";

export type FilterSelectSearch<TValue extends string> = {
  readonly emptyLabel?: string;
  readonly errorLabel?: string;
  readonly loadOptions: (
    searchText: string,
  ) => Promise<readonly FilterSelectOption<TValue>[]>;
  readonly loadingLabel?: string;
  readonly minLength?: number;
  readonly placeholder?: string;
};

type FilterSelectProps<TValue extends string> = {
  readonly label: string;
  readonly mode?: FilterSelectMode;
  readonly options: readonly FilterSelectOption<TValue>[];
  readonly selectedValues: readonly TValue[];
  readonly onChange: (values: TValue[]) => void;
  readonly clearLabel?: string;
  readonly disabled?: boolean;
  readonly search?: FilterSelectSearch<TValue>;
  readonly selectedOptions?: readonly FilterSelectOption<TValue>[];
};

export function FilterSelect<TValue extends string>({
  clearLabel = "Limpar filtro",
  disabled = false,
  label,
  mode = "multiple",
  onChange,
  options,
  search,
  selectedOptions = [],
  selectedValues,
}: FilterSelectProps<TValue>) {
  const [open, setOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchOptions, setSearchOptions] = useState<
    readonly FilterSelectOption<TValue>[]
  >([]);
  const [openSelectedValues, setOpenSelectedValues] = useState<
    readonly TValue[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const selectedSet = new Set(selectedValues);
  const hasSearch = Boolean(search);
  const searchLoadOptions = search?.loadOptions;
  const searchMinLength = search?.minLength;
  const visibleOptions = useMemo(
    () =>
      mergeOptions(
        hasSearch ? [...searchOptions, ...selectedOptions] : options,
        openSelectedValues,
      ),
    [hasSearch, openSelectedValues, options, searchOptions, selectedOptions],
  );

  useEffect(() => {
    if (!open || !searchLoadOptions) {
      return;
    }

    const minLength = searchMinLength ?? 0;
    const query = searchText.trim();

    if (query.length < minLength) {
      setSearchOptions([]);
      setSearching(false);
      setSearchFailed(false);
      return;
    }

    let canceled = false;
    setSearching(true);
    setSearchFailed(false);

    const timeoutId = window.setTimeout(() => {
      searchLoadOptions(query)
        .then((nextOptions) => {
          if (!canceled) {
            setSearchOptions(nextOptions);
          }
        })
        .catch(() => {
          if (!canceled) {
            setSearchFailed(true);
            setSearchOptions([]);
          }
        })
        .finally(() => {
          if (!canceled) {
            setSearching(false);
          }
        });
    }, 250);

    return () => {
      canceled = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, searchLoadOptions, searchMinLength, searchText]);

  useEffect(() => {
    if (open && search) {
      window.setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [open, search]);

  function toggle(value: TValue) {
    if (mode === "single") {
      const nextValues = selectedSet.has(value) ? [] : [value];
      onChange(nextValues);
      setOpen(false);
      return;
    }

    const nextValues = new Set(selectedSet);

    if (nextValues.has(value)) {
      nextValues.delete(value);
    } else {
      nextValues.add(value);
    }

    onChange([...nextValues]);
  }

  function clear() {
    onChange([]);
    setOpen(false);
  }

  function toggleOpen() {
    setOpen((current) => {
      if (!current) {
        setOpenSelectedValues(selectedValues);
      }

      return !current;
    });
  }

  return (
    <Dropdown
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpenSelectedValues(selectedValues);
        }

        setOpen(nextOpen);
      }}
      open={open}
      panelClassName="overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-2xl shadow-black/45"
      trigger={({ open: dropdownOpen, triggerRef }) => (
        <button
          aria-expanded={dropdownOpen}
          className={`flex h-8 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition focus:outline-none focus-visible:ring-1 focus-visible:ring-accent ${
            selectedValues.length > 0
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-border bg-panel text-muted hover:bg-surface-elevated hover:text-foreground"
          }`}
          onClick={toggleOpen}
          disabled={disabled}
          ref={(node) => {
            triggerRef.current = node;
          }}
          type="button"
        >
          <span>{label}</span>
          {selectedValues.length > 0 ? (
            <span className="flex min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
              {selectedValues.length}
            </span>
          ) : null}
          {dropdownOpen ? (
            <ChevronUp className="size-3" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-3" aria-hidden="true" />
          )}
        </button>
      )}
      width={224}
    >
      {search ? (
        <div className="border-b border-border p-2">
          <input
            className="h-8 w-full rounded-md border border-border bg-panel px-2.5 text-xs text-foreground outline-none placeholder:text-muted focus:ring-1 focus:ring-accent"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder={search.placeholder ?? "Buscar..."}
            ref={searchInputRef}
            value={searchText}
          />
        </div>
      ) : null}

      <div className="grid py-1">
        {visibleOptions.map((option) => {
          const selected = selectedSet.has(option.value);

          return (
            <button
              className="flex min-h-8 w-full items-center gap-2 px-3 text-left text-xs font-semibold text-foreground transition hover:bg-surface"
              key={option.value}
              onClick={() => toggle(option.value)}
              disabled={disabled}
              type="button"
            >
              <span
                className={`flex size-3.5 shrink-0 items-center justify-center rounded border ${
                  selected
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border bg-panel"
                }`}
              >
                {selected ? (
                  <Check className="size-2.5" aria-hidden="true" />
                ) : null}
              </span>
              <span className="min-w-0 truncate">
                {option.content ?? option.label}
              </span>
            </button>
          );
        })}

        {searching ? (
          <span className="px-3 py-2 text-xs text-muted">
            {search?.loadingLabel ?? "Buscando..."}
          </span>
        ) : null}

        {!searching && searchFailed ? (
          <span className="px-3 py-2 text-xs text-negative">
            {search?.errorLabel ?? "Nao foi possivel buscar"}
          </span>
        ) : null}

        {!searching && !searchFailed && visibleOptions.length === 0 ? (
          <span className="px-3 py-2 text-xs text-muted">
            {search?.emptyLabel ?? "Nenhuma opcao encontrada"}
          </span>
        ) : null}
      </div>

      {selectedValues.length > 0 ? (
        <button
          className="flex min-h-9 w-full items-center gap-2 border-t border-border px-3 text-left text-xs text-muted transition hover:bg-surface hover:text-foreground"
          onClick={clear}
          disabled={disabled}
          type="button"
        >
          <X className="size-3.5" aria-hidden="true" />
          {clearLabel}
        </button>
      ) : null}
    </Dropdown>
  );
}

function mergeOptions<TValue extends string>(
  options: readonly FilterSelectOption<TValue>[],
  selectedValues: readonly TValue[],
): FilterSelectOption<TValue>[] {
  const selectedSet = new Set(selectedValues);
  const map = new Map<TValue, FilterSelectOption<TValue>>();

  for (const option of options) {
    map.set(option.value, option);
  }

  return [...map.values()].sort((first, second) => {
    const firstSelected = selectedSet.has(first.value);
    const secondSelected = selectedSet.has(second.value);

    if (firstSelected === secondSelected) {
      return 0;
    }

    return firstSelected ? -1 : 1;
  });
}
