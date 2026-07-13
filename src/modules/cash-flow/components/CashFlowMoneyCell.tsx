import { cn } from "@/lib/utils";

type MoneyTone = "auto" | "default" | "muted" | "negative" | "positive";

type CashFlowMoneyCellProps = {
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly onClick?: () => void;
  readonly signed?: boolean;
  readonly tone?: MoneyTone;
  readonly valueInCents: number;
  readonly zeroAsDash?: boolean;
};

export function CashFlowMoneyCell({
  ariaLabel,
  className,
  onClick,
  signed = false,
  tone = "default",
  valueInCents,
  zeroAsDash = false,
}: CashFlowMoneyCellProps) {
  const canOpen = valueInCents !== 0 && onClick !== undefined;
  const content =
    zeroAsDash && valueInCents === 0
      ? "–"
      : signed
        ? formatSignedMoney(valueInCents)
        : formatMoney(valueInCents);

  return (
    <td
      className={cn(
        "min-w-28 border-t border-border px-3 py-3 text-right text-[11px] tabular-nums",
        toneClass(tone, valueInCents),
        className,
      )}
    >
      {canOpen ? (
        <button
          aria-label={ariaLabel}
          className="rounded-sm underline decoration-dotted underline-offset-4 transition hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
          onClick={onClick}
          title={`${ariaLabel ?? "Abrir lançamentos"}: ${formatMoney(valueInCents)}`}
          type="button"
        >
          {content}
        </button>
      ) : (
        content
      )}
    </td>
  );
}

export function formatMoney(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(valueInCents / 100);
}

export function formatSignedMoney(valueInCents: number): string {
  if (valueInCents > 0) return `+ ${formatMoney(valueInCents)}`;
  if (valueInCents < 0) return `− ${formatMoney(Math.abs(valueInCents))}`;
  return formatMoney(0);
}

function toneClass(tone: MoneyTone, valueInCents: number): string {
  const resolvedTone =
    tone === "auto"
      ? valueInCents > 0
        ? "positive"
        : valueInCents < 0
          ? "negative"
          : "muted"
      : tone;

  return {
    default: "text-foreground",
    muted: "text-muted",
    negative: "text-negative",
    positive: "text-positive",
  }[resolvedTone];
}
