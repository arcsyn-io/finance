import Link from "next/link";
import { EntriesTable } from "@/modules/entries/components/EntriesTable";
import { getCurrentApplicationContext } from "@/server/context/current-application-context";
import { createCategoryService } from "@/server/services/category-service-factory";
import { createEntryService } from "@/server/services/entry-service-factory";
import { createWalletService } from "@/server/services/wallet-service-factory";

export const dynamic = "force-dynamic";

type TransactionsPageProps = {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const context = await getCurrentApplicationContext();
  const entryService = createEntryService();
  const walletService = createWalletService();
  const categoryService = await createCategoryService();
  const params = (await searchParams) ?? {};
  const currentRange = currentMonthRange();
  const startDate = validDateParam(params.startDate) ?? currentRange.startDate;
  const endDate = validDateParam(params.endDate) ?? currentRange.endDate;
  const importedCount = validCountParam(params.importedCount);

  const [entries, wallets, categories] = await Promise.all([
    entryService.list(context, {
      startDate,
      endDate,
      includeDeleted: false,
    }),
    walletService.list(context, { includeInactive: false }),
    categoryService.list(context, { includeInactive: false }),
  ]);

  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Link
            className="text-[10px] font-semibold uppercase tracking-widest text-accent"
            href="/"
          >
            Registros
          </Link>
          <h1 className="mt-2 text-xl font-semibold tracking-tight">
            Transacoes
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Registre fatos financeiros com carteira, categoria, natureza e
            evento economico sem misturar fluxo de caixa, liquidez e patrimonio.
          </p>
        </div>
      </header>

      <EntriesTable
        categories={categories}
        initialEndDate={endDate}
        initialEntries={entries}
        initialStartDate={startDate}
        initialToastMessage={
          importedCount === null
            ? undefined
            : `Importacao confirmada: ${importedCount} lancamentos criados`
        }
        wallets={wallets}
      />
    </div>
  );
}

function validDateParam(value: string | string[] | undefined): string | null {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : null;
}

function validCountParam(value: string | string[] | undefined): number | null {
  if (typeof value !== "string" || !/^\d+$/.test(value)) return null;
  return Number(value);
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: toDateInput(start),
    endDate: toDateInput(end),
  };
}

function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}
