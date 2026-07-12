import { CircleDollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { PeriodFilterPreset } from "@/components/ui/PeriodFilter";
import { CategoryConsumptionTrigger } from "@/modules/consumption/components/CategoryConsumptionTrigger";
import { ConsumptionPeriodControl } from "@/modules/consumption/components/ConsumptionPeriodControl";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";
import { createConsumptionService } from "@/server/services/consumption-service-factory";

export const dynamic = "force-dynamic";

type ConsumptionPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ConsumptionPage({ searchParams }: ConsumptionPageProps) {
  const params = (await searchParams) ?? {};
  const currentRange = currentMonthRange();
  const requestedStart = validDateParam(params.startDate);
  const requestedEnd = validDateParam(params.endDate);
  const validRange = requestedStart && requestedEnd && requestedStart <= requestedEnd;
  const startDate = validRange ? requestedStart : currentRange.startDate;
  const endDate = validRange ? requestedEnd : currentRange.endDate;
  const preset = validPreset(params.preset, startDate, endDate);
  const context = await getCurrentApplicationContext();
  const categoryService = await createCategoryService();
  const [report, categories] = await Promise.all([
    createConsumptionService().getByCategory(context, { startDate, endDate }),
    categoryService.list(context, { includeInactive: false }),
  ]);

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Analises
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Consumo por categoria
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Distribuicao do consumo patrimonial por competencia, sem misturar
            pagamentos, transferencias ou movimentacoes de caixa.
          </p>
        </div>
        <ConsumptionPeriodControl
          endDate={endDate}
          preset={preset}
          startDate={startDate}
        />
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Consumo total
            </p>
            <strong className="mt-2 block text-2xl font-bold tabular-nums text-foreground">
              {formatMoney(report.totalCents)}
            </strong>
            <p className="mt-1 text-[11px] text-muted">
              {formatDate(startDate)} a {formatDate(endDate)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
              Categorias com consumo
            </p>
            <strong className="mt-2 block text-2xl font-bold tabular-nums text-foreground">
              {report.categories.length}
            </strong>
            <p className="mt-1 text-[11px] text-muted">
              Lancamentos patrimoniais de saida
            </p>
          </CardContent>
        </Card>
      </section>

      {report.categories.length === 0 ? (
        <Card>
          <CardContent className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface-elevated text-muted">
              <CircleDollarSign className="size-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-sm font-semibold">Nenhum consumo no periodo</h2>
            <p className="mt-1 max-w-md text-xs leading-5 text-muted">
              Ajuste o periodo ou registre lancamentos patrimoniais de saida com categoria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-panel px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Categoria
                  </th>
                  {report.months.map((month) => (
                    <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted" key={month}>
                      {formatMonth(month)}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.categories.map((category) => (
                  <tr key={category.categoryId}>
                    <td className="sticky left-0 z-10 border-t border-border bg-panel px-4 py-3">
                      <CategoryConsumptionTrigger
                        categories={categories}
                        category={category}
                        endDate={endDate}
                        startDate={startDate}
                      />
                    </td>
                    {category.monthlyAmountsCents.map((amount, index) => (
                      <td className="border-t border-border px-4 py-3 text-right text-xs tabular-nums text-muted" key={`${category.categoryId}-${report.months[index]}`}>
                        {amount === 0 ? "-" : formatMoney(amount)}
                      </td>
                    ))}
                    <td className="border-t border-border px-4 py-3 text-right text-xs font-semibold tabular-nums">
                      {formatMoney(category.totalCents)}
                    </td>
                  </tr>
                ))}
                <tr className="bg-surface/60 font-semibold">
                  <td className="sticky left-0 z-10 border-t border-border bg-surface px-4 py-3 text-xs">Total</td>
                  {report.months.map((month, monthIndex) => (
                    <td className="border-t border-border px-4 py-3 text-right text-xs tabular-nums" key={month}>
                      {formatMoney(report.categories.reduce((total, category) => total + category.monthlyAmountsCents[monthIndex], 0))}
                    </td>
                  ))}
                  <td className="border-t border-border px-4 py-3 text-right text-xs tabular-nums text-accent">
                    {formatMoney(report.totalCents)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function validDateParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function validPreset(value: string | string[] | undefined, startDate: string, endDate: string): PeriodFilterPreset {
  const allowed: PeriodFilterPreset[] = ["today", "current-month", "current-quarter", "current-semester", "custom"];
  if (typeof value === "string" && allowed.includes(value as PeriodFilterPreset)) return value as PeriodFilterPreset;
  const current = currentMonthRange();
  return startDate === current.startDate && endDate === current.endDate ? "current-month" : "custom";
}

function currentMonthRange() {
  const now = new Date();
  return {
    startDate: toLocalDateInput(
      new Date(now.getFullYear(), now.getMonth(), 1),
    ),
    endDate: toLocalDateInput(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    ),
  };
}

function toLocalDateInput(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatMoney(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valueInCents / 100);
}

function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatMonth(value: string): string {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, 1)))
    .replace(" de ", "/");
}
