import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando detalhes da carteira"
      className="flex w-full flex-col gap-5 lg:gap-6"
      role="status"
    >
      <header>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-3 h-7 w-52" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
      </header>
      <div className="overflow-hidden rounded-xl border border-border bg-panel">
        <div className="hidden grid-cols-[110px_130px_1fr_110px_130px_110px_80px] gap-4 border-b border-border px-4 py-3 md:grid">
          {Array.from({ length: 7 }).map((_, index) => (
            <Skeleton className="h-3" key={index} />
          ))}
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 7 }).map((_, rowIndex) => (
            <div
              className="grid gap-3 px-4 py-4 md:grid-cols-[110px_130px_1fr_110px_130px_110px_80px]"
              key={rowIndex}
            >
              {Array.from({ length: 7 }).map((__, columnIndex) => (
                <Skeleton className="h-4" key={columnIndex} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Carregando detalhes da carteira...</span>
    </div>
  );
}
