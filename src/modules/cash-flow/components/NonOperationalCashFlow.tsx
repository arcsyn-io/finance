"use client";

import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
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

type NonOperationalCashFlowProps = {
  readonly onOpenDetail: (selection: CashFlowDetailSelection) => void;
  readonly report: AnnualCashFlowViewModel;
};

export function NonOperationalCashFlow({
  onOpenDetail,
  report,
}: NonOperationalCashFlowProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Movimentações não operacionais</CardTitle>
        <CardDescription>
          Transferências e fatos patrimoniais em carteiras de caixa. Estes valores ficam visíveis, mas não alteram o fluxo operacional acima.
        </CardDescription>
      </CardHeader>
      <div className="finance-scrollbar overflow-x-auto pb-1">
        <table className="w-full min-w-[1540px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-56 bg-panel px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                Composição auxiliar
              </th>
              {report.months.map((month) => (
                <th
                  className="min-w-28 bg-panel px-3 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted"
                  key={month.referenceMonth}
                >
                  {formatMonth(month.referenceMonth)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <SectionLabel icon={<ArrowDownLeft />} label="Entradas" />
            <CategoryRows
              categories={report.nonOperationalIncomeCategories}
              direction="IN"
              months={report.months}
              onOpenDetail={onOpenDetail}
              tone="positive"
            />
            <TotalRow
              direction="IN"
              label="Total de entradas"
              months={report.months}
              onOpenDetail={onOpenDetail}
              tone="positive"
              value={(month) => month.nonOperationalCashInCents}
            />

            <SectionLabel icon={<ArrowUpRight />} label="Saídas" />
            <CategoryRows
              categories={report.nonOperationalExpenseCategories}
              direction="OUT"
              months={report.months}
              onOpenDetail={onOpenDetail}
              tone="negative"
            />
            <TotalRow
              direction="OUT"
              label="Total de saídas"
              months={report.months}
              onOpenDetail={onOpenDetail}
              tone="negative"
              value={(month) => month.nonOperationalCashOutCents}
            />

            <tr className="bg-surface/35">
              <th className="sticky left-0 z-10 border-t border-border bg-surface px-4 py-3 text-left text-xs font-semibold">
                Resultado não operacional
              </th>
              {report.months.map((month) => (
                <CashFlowMoneyCell
                  className="font-semibold"
                  key={`non-operational-result-${month.referenceMonth}`}
                  signed
                  tone="auto"
                  valueInCents={month.nonOperationalNetCashFlowCents}
                  zeroAsDash
                />
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SectionLabel({
  icon,
  label,
}: {
  readonly icon: React.ReactElement;
  readonly label: string;
}) {
  return (
    <tr className="bg-surface">
      <th
        className="sticky left-0 z-10 min-w-56 border-t border-border bg-surface px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted"
      >
        <span className="inline-flex items-center gap-2 [&_svg]:size-3.5">
          {icon} {label}
        </span>
      </th>
      <td
        aria-hidden="true"
        className="border-t border-border bg-surface"
        colSpan={12}
      />
    </tr>
  );
}

function CategoryRows({
  categories,
  direction,
  months,
  onOpenDetail,
  tone,
}: {
  readonly categories: readonly CashFlowCategoryViewModel[];
  readonly direction: "IN" | "OUT";
  readonly months: readonly CashFlowMonthViewModel[];
  readonly onOpenDetail: (selection: CashFlowDetailSelection) => void;
  readonly tone: "negative" | "positive";
}) {
  if (categories.length === 0) {
    return (
      <tr>
        <td className="sticky left-0 z-10 border-t border-border bg-panel px-4 py-2.5 pl-8 text-[11px] text-muted">
          Sem categorias no ano
        </td>
        {months.map((month) => (
          <td
            className="min-w-28 border-t border-border px-3 py-2.5 text-right text-[11px] text-muted"
            key={`empty-${direction}-${month.referenceMonth}`}
          >
            –
          </td>
        ))}
      </tr>
    );
  }

  return categories.map((category) => (
    <tr key={`${direction}-${category.categoryId ?? "uncategorized"}`}>
      <th className="sticky left-0 z-10 border-t border-border bg-panel px-4 py-2.5 pl-8 text-left text-[11px] font-medium text-muted">
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
          className="py-2.5"
          key={`${category.categoryId ?? "uncategorized"}-${month.referenceMonth}`}
          onClick={() =>
            onOpenDetail({
              categoryId: category.categoryId,
              direction,
              referenceMonth: month.referenceMonth,
              scope: "NON_OPERATIONAL",
              title: category.categoryName,
            })
          }
          tone={tone}
          valueInCents={category.monthlyAmountsCents[monthIndex] ?? 0}
          zeroAsDash
        />
      ))}
    </tr>
  ));
}

function TotalRow({
  direction,
  label,
  months,
  onOpenDetail,
  tone,
  value,
}: {
  readonly direction: "IN" | "OUT";
  readonly label: string;
  readonly months: readonly CashFlowMonthViewModel[];
  readonly onOpenDetail: (selection: CashFlowDetailSelection) => void;
  readonly tone: "negative" | "positive";
  readonly value: (month: CashFlowMonthViewModel) => number;
}) {
  return (
    <tr className="bg-surface/20">
      <th className="sticky left-0 z-10 border-t border-border bg-surface px-4 py-3 text-left text-xs font-semibold">
        {label}
      </th>
      {months.map((month) => (
        <CashFlowMoneyCell
          ariaLabel={`Abrir ${label.toLowerCase()} de ${formatMonthLong(month.referenceMonth)}`}
          className="font-semibold"
          key={`${label}-${month.referenceMonth}`}
          onClick={() =>
            onOpenDetail({
              direction,
              referenceMonth: month.referenceMonth,
              scope: "NON_OPERATIONAL",
              title: label,
            })
          }
          tone={tone}
          valueInCents={value(month)}
          zeroAsDash
        />
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
