import { Skeleton } from "@/components/ui/skeleton";

export type PrivatePageSkeletonPage =
  | "categories"
  | "cash-flow"
  | "consumption"
  | "dashboard"
  | "help"
  | "imports"
  | "transactions"
  | "wallets";

type PrivatePageSkeletonProps = {
  readonly page: PrivatePageSkeletonPage;
};

const labels: Record<PrivatePageSkeletonPage, string> = {
  categories: "Categorias",
  "cash-flow": "Fluxo de caixa operacional",
  consumption: "Consumo por categoria",
  dashboard: "Painel",
  help: "Ajuda",
  imports: "Importações",
  transactions: "Transações",
  wallets: "Carteiras",
};

export function PrivatePageSkeleton({ page }: PrivatePageSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label={`Carregando ${labels[page]}`}
      className="flex w-full flex-col gap-5 lg:gap-6"
      role="status"
    >
      <PageHeaderSkeleton action={page === "categories" || page === "dashboard"} />
      {page === "dashboard" ? <DashboardSkeleton /> : null}
      {page === "transactions" ? <TransactionsSkeleton /> : null}
      {page === "imports" ? <ImportsSkeleton /> : null}
      {page === "wallets" ? <WalletsSkeleton /> : null}
      {page === "categories" ? <CategoriesSkeleton /> : null}
      {page === "consumption" ? <ConsumptionSkeleton /> : null}
      {page === "cash-flow" ? <CashFlowSkeleton /> : null}
      {page === "help" ? <HelpSkeleton /> : null}
      <span className="sr-only">Carregando {labels[page]}...</span>
    </div>
  );
}

function PageHeaderSkeleton({ action }: { readonly action: boolean }) {
  return (
    <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0 flex-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-52" />
        <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      </div>
      {action ? <Skeleton className="h-9 w-36 rounded-lg" /> : null}
    </header>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <Skeleton className="h-20 rounded-xl" />
      <MetricCards />
      <section className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-56 rounded-xl" key={index} />
        ))}
      </section>
      <TableSkeleton columns={9} rows={6} />
    </>
  );
}

function TransactionsSkeleton() {
  return (
    <>
      <div className="flex flex-wrap items-end gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-8 w-28 rounded-lg" key={index} />
        ))}
      </div>
      <MetricCards />
      <TableSkeleton columns={7} rows={7} />
    </>
  );
}

function ImportsSkeleton() {
  return (
    <>
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <TableSkeleton columns={8} rows={6} />
    </>
  );
}

function WalletsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="rounded-lg border border-border bg-panel p-4" key={index}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="mt-3 h-4 w-24" />
            </div>
            <Skeleton className="size-8 rounded-md" />
          </div>
          <Skeleton className="mt-5 h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

function CategoriesSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, groupIndex) => (
        <div className="rounded-lg border border-border bg-panel p-4" key={groupIndex}>
          <Skeleton className="h-5 w-32" />
          <div className="mt-4 grid gap-2">
            {Array.from({ length: 5 }).map((__, index) => (
              <div className="flex items-center gap-3 rounded-md border border-border bg-surface/70 p-3" key={index}>
                <Skeleton className="size-7 rounded-md" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ConsumptionSkeleton() {
  return (
    <>
      <MetricCards count={2} />
      <TableSkeleton columns={6} rows={6} />
    </>
  );
}

function CashFlowSkeleton() {
  return (
    <>
      <section className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton className="h-64 rounded-xl" key={index} />
        ))}
      </section>
      <TableSkeleton columns={8} rows={10} />
      <TableSkeleton columns={6} rows={4} />
    </>
  );
}

function HelpSkeleton() {
  return (
    <>
      <Skeleton className="h-44 rounded-xl" />
      <div className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-52 rounded-xl" key={index} />
        ))}
      </div>
      <Skeleton className="h-72 rounded-xl" />
    </>
  );
}

function MetricCards({ count = 4 }: { readonly count?: number }) {
  return (
    <section className={`grid grid-cols-2 gap-3 ${count === 4 ? "lg:grid-cols-4" : "sm:grid-cols-2"}`}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton className="h-20 rounded-xl" key={index} />
      ))}
    </section>
  );
}

function TableSkeleton({ columns, rows }: { readonly columns: number; readonly rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-panel">
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            className="grid gap-4 px-4 py-3"
            key={rowIndex}
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(72px, 1fr))` }}
          >
            {Array.from({ length: columns }).map((__, columnIndex) => (
              <Skeleton className="h-5" key={columnIndex} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
