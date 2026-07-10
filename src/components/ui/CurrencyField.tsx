"use client";

import type { InputHTMLAttributes } from "react";

type CurrencyFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "type" | "value"
> & {
  readonly formatMask?: string;
  readonly onValueInCentsChange: (valueInCents: number) => void;
  readonly symbol?: string;
  readonly valueInCents: number;
};

export function CurrencyField({
  className = "",
  formatMask = "###.####,##",
  onValueInCentsChange,
  symbol = "R$",
  valueInCents,
  ...inputProps
}: CurrencyFieldProps) {
  return (
    <label
      className={`flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface/70 px-2.5 text-xs text-foreground focus-within:ring-1 focus-within:ring-accent ${className}`}
    >
      <span className="shrink-0 text-muted">{symbol}</span>
      <input
        {...inputProps}
        className="min-w-0 flex-1 bg-transparent text-right tabular-nums outline-none placeholder:text-muted"
        inputMode="numeric"
        onChange={(event) =>
          onValueInCentsChange(currencyInputToCents(event.target.value))
        }
        type="text"
        value={formatCurrencyInput(valueInCents, formatMask)}
      />
    </label>
  );
}

export function currencyInputToCents(value: string): number {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return 0;
  }

  return Number.parseInt(digits, 10);
}

export function formatCurrencyInput(
  valueInCents: number,
  formatMask = "###.####,##",
): string {
  const { decimalSeparator, decimalSize, groupSeparator } =
    parseCurrencyMask(formatMask);
  const safeValue = Math.max(0, Math.trunc(valueInCents));
  const paddedValue = String(safeValue).padStart(decimalSize + 1, "0");
  const integerValue = paddedValue.slice(0, -decimalSize);
  const decimalValue = paddedValue.slice(-decimalSize);
  const groupedInteger = integerValue.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    groupSeparator,
  );

  return `${groupedInteger}${decimalSeparator}${decimalValue}`;
}

function parseCurrencyMask(formatMask: string) {
  const separators = [...formatMask.matchAll(/[^#]/g)];
  const decimalSeparator = separators.at(-1)?.[0] ?? ",";
  const decimalIndex = formatMask.lastIndexOf(decimalSeparator);
  const decimalSize =
    decimalIndex >= 0
      ? formatMask.slice(decimalIndex + 1).replace(/[^#]/g, "").length
      : 2;
  const groupSeparator =
    separators.find((separator) => separator[0] !== decimalSeparator)?.[0] ??
    ".";

  return {
    decimalSeparator,
    decimalSize: Math.max(decimalSize, 1),
    groupSeparator,
  };
}
