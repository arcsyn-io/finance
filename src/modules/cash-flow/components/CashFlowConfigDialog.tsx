"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LoaderCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CurrencyField } from "@/components/ui/CurrencyField";
import type { CashFlowMonthViewModel } from "@/modules/cash-flow/view-models/cash-flow-view-model";

type CashFlowConfigDialogProps = {
  readonly month: CashFlowMonthViewModel;
  readonly onClose: () => void;
  readonly onSaved: (message: string) => void;
};

export function CashFlowConfigDialog({
  month,
  onClose,
  onSaved,
}: CashFlowConfigDialogProps) {
  const router = useRouter();
  const [openingBalanceCents, setOpeningBalanceCents] = useState(
    month.openingBalanceCents,
  );
  const [minimumCashCents, setMinimumCashCents] = useState(
    month.minimumCashCents,
  );
  const [applyToFollowingMonths, setApplyToFollowingMonths] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) onClose();
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, saving]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/cash-flow/config", {
        body: JSON.stringify({
          applyToFollowingMonths,
          minimumCashCents,
          openingBalanceCents,
          referenceMonth: month.referenceMonth,
        }),
        headers: { "Content-Type": "application/json" },
        method: "PUT",
      });
      const body = (await response.json()) as {
        readonly error?: string;
        readonly status?: "updated";
      };

      if (!response.ok || body.status !== "updated") {
        throw new Error(
          body.error ?? "Não foi possível salvar a configuração do fluxo de caixa",
        );
      }

      router.refresh();
      onSaved(
        applyToFollowingMonths
          ? `Configuração de ${formatMonth(month.referenceMonth)} aplicada até dezembro.`
          : `Configuração de ${formatMonth(month.referenceMonth)} salva.`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Não foi possível salvar a configuração do fluxo de caixa",
      );
    } finally {
      setSaving(false);
    }
  }

  return createPortal(
    <div
      aria-labelledby="cash-flow-config-title"
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Fechar configuração"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        disabled={saving}
        onClick={onClose}
        type="button"
      />
      <section className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-panel shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              Parâmetros gerenciais
            </p>
            <h2 className="mt-1 text-base font-semibold" id="cash-flow-config-title">
              {formatMonth(month.referenceMonth)}
            </h2>
          </div>
          <button
            aria-label="Fechar"
            className="flex size-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-elevated hover:text-foreground disabled:opacity-50"
            disabled={saving}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </header>

        <form className="space-y-5 p-5" onSubmit={save}>
          <div>
            <label className="mb-1.5 block text-xs font-medium" htmlFor="opening-balance">
              Saldo de caixa inicial
            </label>
            <CurrencyField
              autoFocus
              id="opening-balance"
              onValueInCentsChange={setOpeningBalanceCents}
              valueInCents={openingBalanceCents}
            />
            <p className="mt-1.5 text-[11px] leading-4 text-muted">
              Valor disponível no começo do mês. Esta configuração não cria lançamentos.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium" htmlFor="minimum-cash">
              Caixa mínimo
            </label>
            <CurrencyField
              id="minimum-cash"
              onValueInCentsChange={setMinimumCashCents}
              valueInCents={minimumCashCents}
            />
            <p className="mt-1.5 text-[11px] leading-4 text-muted">
              Reserva de segurança usada para calcular excedente ou necessidade de resgate.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-surface/40 p-3">
            <input
              checked={applyToFollowingMonths}
              className="mt-0.5 size-4 accent-accent"
              onChange={(event) => setApplyToFollowingMonths(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block text-xs font-medium">Aplicar aos meses seguintes</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-muted">
                Replica os dois valores deste mês até dezembro de {month.referenceMonth.slice(0, 4)}.
              </span>
            </span>
          </label>

          {error ? (
            <p className="rounded-lg bg-negative/10 px-3 py-2 text-xs text-negative" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button disabled={saving} onClick={onClose} type="button" variant="ghost">
              Cancelar
            </Button>
            <Button disabled={saving} type="submit">
              {saving ? <LoaderCircle aria-hidden="true" className="animate-spin" /> : null}
              {saving ? "Salvando..." : "Salvar configuração"}
            </Button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
}

function formatMonth(referenceMonth: string): string {
  const [year, month] = referenceMonth.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}
