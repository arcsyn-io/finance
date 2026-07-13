"use client";

import { useState } from "react";
import { ChevronRight, Pencil } from "lucide-react";
import type {
  AnnualCashFlowViewModel,
  CashFlowCategoryViewModel,
  CashFlowMonthViewModel,
} from "@/modules/cash-flow/view-models/cash-flow-view-model";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CashFlowMoneyCell, formatMoney } from "@/modules/cash-flow/components/CashFlowMoneyCell";
import type { CashFlowDetailSelection } from "@/modules/cash-flow/components/CashFlowEntriesDialog";

type CashFlowMatrixProps = {
  readonly onOpenConfig: (month: CashFlowMonthViewModel) => void;
  readonly onOpenDetail: (selection: CashFlowDetailSelection) => void;
  readonly report: AnnualCashFlowViewModel;
};

export function CashFlowMatrix({
  onOpenConfig,
  onOpenDetail,
  report,
}: CashFlowMatrixProps) {
  const [receiptsExpanded, setReceiptsExpanded] = useState(false);
  const [expensesExpanded, setExpensesExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Matriz anual do caixa operacional</CardTitle>
          <CardDescription className="mt-1">
            Expanda recebimentos e despesas para conferir as categorias. Valores sublinhados abrem os lançamentos.
          </CardDescription>
        </div>
        <span className="hidden rounded-md bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent sm:inline-flex">
          12 meses
        </span>
      </CardHeader>
      <div className="finance-scrollbar overflow-x-auto pb-1">
        <table className="w-full min-w-[1120px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-40 bg-panel px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                Indicador
              </th>
              {report.months.map((month) => (
                <th
                  className="min-w-20 bg-panel px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted"
                  key={month.referenceMonth}
                >
                  {formatMonth(month.referenceMonth)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ExpandableFlowRows
              categories={report.operationalIncomeCategories}
              direction="IN"
              expanded={receiptsExpanded}
              label="Recebimentos"
              months={report.months}
              onOpenDetail={onOpenDetail}
              onToggle={() => setReceiptsExpanded((current) => !current)}
              totalValue={(month) => month.receiptsCents}
              tone="positive"
            />
            <ExpandableFlowRows
              categories={report.operationalExpenseCategories}
              direction="OUT"
              expanded={expensesExpanded}
              label="Despesas"
              months={report.months}
              onOpenDetail={onOpenDetail}
              onToggle={() => setExpensesExpanded((current) => !current)}
              totalValue={(month) => month.expensesCents}
              tone="negative"
            />
            <ResultRow
              label="Fluxo líquido"
              months={report.months}
              value={(month) => month.netCashFlowCents}
            />
            <ConfigRow
              label="Saldo inicial"
              months={report.months}
              onOpenConfig={onOpenConfig}
              value={(month) => month.openingBalanceCents}
            />
            <ResultRow
              label="Saldo final"
              months={report.months}
              value={(month) => month.closingBalanceCents}
            />
            <ConfigRow
              label="Caixa mínimo"
              months={report.months}
              onOpenConfig={onOpenConfig}
              value={(month) => month.minimumCashCents}
            />
            <ResultRow
              emphasis
              label="Excedente / resgate"
              months={report.months}
              value={(month) => month.surplusOrDeficitCents}
            />
          </tbody>
        </table>
      </div>
      <p className="border-t border-border px-4 py-3 text-[11px] leading-4 text-muted">
        Fluxo líquido = recebimentos − despesas. Saldo final = saldo inicial + fluxo líquido. Excedente ou resgate = saldo final − caixa mínimo.
      </p>
    </Card>
  );
}

function ExpandableFlowRows({
  categories,
  direction,
  expanded,
  label,
  months,
  onOpenDetail,
  onToggle,
  tone,
  totalValue,
}: {
  readonly categories: readonly CashFlowCategoryViewModel[];
  readonly direction: "IN" | "OUT";
  readonly expanded: boolean;
  readonly label: string;
  readonly months: readonly CashFlowMonthViewModel[];
  readonly onOpenDetail: (selection: CashFlowDetailSelection) => void;
  readonly onToggle: () => void;
  readonly tone: "negative" | "positive";
  readonly totalValue: (month: CashFlowMonthViewModel) => number;
}) {
  return (
    <>
      <tr className="bg-surface/35">
        <th className="sticky left-0 z-10 border-t border-border bg-surface px-4 py-3 text-left">
          <button
            aria-expanded={expanded}
            className="flex w-full items-center gap-2 rounded-sm text-left text-xs font-semibold outline-none hover:text-accent focus-visible:ring-1 focus-visible:ring-accent"
            onClick={onToggle}
            type="button"
          >
            <ChevronRight
              aria-hidden="true"
              className={`size-3.5 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
            <span>{label}</span>
            <span className="ml-auto rounded-full bg-surface-elevated px-1.5 py-0.5 text-[9px] font-medium text-muted">
              {categories.length}
            </span>
          </button>
        </th>
        {months.map((month) => {
          const valueInCents = totalValue(month);
          return (
            <CashFlowMoneyCell
              ariaLabel={`Abrir ${label.toLowerCase()} de ${formatMonthLong(month.referenceMonth)}`}
              className="min-w-20"
              key={`${label}-${month.referenceMonth}`}
              onClick={() =>
                onOpenDetail({
                  direction,
                  referenceMonth: month.referenceMonth,
                  scope: "OPERATIONAL",
                  title: label,
                })
              }
              tone={tone}
              valueInCents={valueInCents}
              zeroAsDash
            />
          );
        })}
      </tr>
      {expanded
        ? categories.map((category) => (
            <tr key={`${direction}-${category.categoryId ?? "uncategorized"}`}>
              <th className="sticky left-0 z-10 border-t border-border bg-panel px-4 py-2.5 pl-10 text-left text-[11px] font-medium text-muted">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full bg-muted"
                    style={category.categoryColor ? { backgroundColor: category.categoryColor } : undefined}
                  />
                  <span className="truncate">{category.categoryName}</span>
                  <span className="ml-auto text-[9px] tabular-nums text-subtle">
                    {formatMoney(category.totalCents)}
                  </span>
                </span>
              </th>
              {months.map((month, monthIndex) => (
                <CashFlowMoneyCell
                  ariaLabel={`Abrir ${category.categoryName} em ${formatMonthLong(month.referenceMonth)}`}
                  className="min-w-20 py-2.5"
                  key={`${category.categoryId ?? "uncategorized"}-${month.referenceMonth}`}
                  onClick={() =>
                    onOpenDetail({
                      categoryId: category.categoryId,
                      direction,
                      referenceMonth: month.referenceMonth,
                      scope: "OPERATIONAL",
                      title: category.categoryName,
                    })
                  }
                  tone={tone}
                  valueInCents={category.monthlyAmountsCents[monthIndex] ?? 0}
                  zeroAsDash
                />
              ))}
            </tr>
          ))
        : null}
    </>
  );
}

function ResultRow({
  emphasis = false,
  label,
  months,
  value,
}: {
  readonly emphasis?: boolean;
  readonly label: string;
  readonly months: readonly CashFlowMonthViewModel[];
  readonly value: (month: CashFlowMonthViewModel) => number;
}) {
  return (
    <tr className={emphasis ? "bg-accent/10" : "bg-surface/25"}>
      <th
        className={`sticky left-0 z-10 border-t border-border px-4 py-3 text-left text-xs ${
          emphasis
            ? "border-l-2 border-l-accent bg-panel font-bold"
            : "bg-surface font-semibold"
        }`}
      >
        {label}
      </th>
      {months.map((month) => (
        <CashFlowMoneyCell
          className={`min-w-20 ${emphasis ? "font-bold" : "font-semibold"}`}
          key={`${label}-${month.referenceMonth}`}
          signed
          tone="auto"
          valueInCents={value(month)}
        />
      ))}
    </tr>
  );
}

function ConfigRow({
  label,
  months,
  onOpenConfig,
  value,
}: {
  readonly label: string;
  readonly months: readonly CashFlowMonthViewModel[];
  readonly onOpenConfig: (month: CashFlowMonthViewModel) => void;
  readonly value: (month: CashFlowMonthViewModel) => number;
}) {
  return (
    <tr>
      <th className="sticky left-0 z-10 border-t border-border bg-panel px-4 py-3 text-left text-xs font-medium">
        <span className="inline-flex items-center gap-2">
          {label}
          <Pencil aria-hidden="true" className="size-3 text-muted" />
        </span>
      </th>
      {months.map((month) => (
        <td
          className="min-w-20 border-t border-border px-3 py-3 text-right text-[11px] tabular-nums"
          key={`${label}-${month.referenceMonth}`}
        >
          <button
            aria-label={`Editar ${label.toLowerCase()} de ${formatMonthLong(month.referenceMonth)}`}
            className="rounded-sm text-muted underline decoration-dotted underline-offset-4 transition hover:text-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
            onClick={() => onOpenConfig(month)}
            title={`Editar configuração de ${formatMonthLong(month.referenceMonth)}`}
            type="button"
          >
            {formatMoney(value(month))}
          </button>
        </td>
      ))}
    </tr>
  );
}

function formatMonth(referenceMonth: string): string {
  const month = Number(referenceMonth.slice(5, 7));
  return new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" })
    .format(new Date(Date.UTC(2024, month - 1, 1)))
    .replace(".", "");
}

function formatMonthLong(referenceMonth: string): string {
  const [year, month] = referenceMonth.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}
