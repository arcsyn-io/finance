import { CashFlowCharts } from "@/modules/cash-flow/components/CashFlowCharts";
import { CashFlowWorkspace } from "@/modules/cash-flow/components/CashFlowWorkspace";
import { YearNavigation } from "@/modules/cash-flow/components/YearNavigation";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCashFlowService } from "@/server/services/cash-flow-service-factory";
import { createCategoryService } from "@/server/services/category-service-factory";
import { createWalletService } from "@/server/services/wallet-service-factory";

export const dynamic = "force-dynamic";

type CashFlowPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CashFlowPage({ searchParams }: CashFlowPageProps) {
  const params = (await searchParams) ?? {};
  const year = validYear(params.year) ?? new Date().getFullYear();
  const context = await getCurrentApplicationContext();
  const cashFlowService = createCashFlowService();
  const categoryService = createCategoryService();
  const walletService = createWalletService();
  const [report, categories, wallets] = await Promise.all([
    cashFlowService.getAnnual(context, { year }),
    categoryService.list(context, { includeInactive: true }),
    walletService.list(context, { includeInactive: true }),
  ]);

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Análises
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Fluxo de caixa operacional
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Visão anual de recebimentos, despesas e necessidade de caixa em carteiras de caixa, sem misturar transferências ou movimentações patrimoniais.
          </p>
        </div>
        <YearNavigation year={report.year} />
      </header>

      <CashFlowCharts report={report} />
      <CashFlowWorkspace categories={categories} report={report} wallets={wallets} />
    </div>
  );
}

function validYear(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d{4}$/.test(value)) return null;
  const year = Number(value);
  return year >= 1900 && year <= 9999 ? year : null;
}
