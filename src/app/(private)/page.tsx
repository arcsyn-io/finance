import Link from "next/link";
import { ArrowUpRight, Landmark, ReceiptText, Tags, Wallet } from "lucide-react";

const metrics = [
  {
    label: "Fluxo operacional",
    value: "R$ 0,00",
    detail: "Receitas e despesas operacionais do mês",
    icon: ReceiptText,
  },
  {
    label: "Liquidez real",
    value: "R$ 0,00",
    detail: "Caixa e ativos negociáveis disponíveis",
    icon: Wallet,
  },
  {
    label: "Patrimônio",
    value: "R$ 0,00",
    detail: "Posição financeira total",
    icon: Landmark,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent">
              Finance
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Visão financeira
            </h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-background transition hover:brightness-110"
              href="/categories"
            >
              Categorias
              <Tags className="h-4 w-4" aria-hidden="true" />
            </Link>
            <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold text-foreground transition hover:border-accent">
              Novo lançamento
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => {
            const Icon = metric.icon;

            return (
              <article
                className="rounded-lg border border-border bg-panel p-5"
                key={metric.label}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted">{metric.label}</p>
                    <strong className="mt-3 block text-2xl font-semibold">
                      {metric.value}
                    </strong>
                  </div>
                  <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted">
                  {metric.detail}
                </p>
              </article>
            );
          })}
        </div>

        <section className="rounded-lg border border-border bg-panel">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-base font-semibold">Próximas etapas</h2>
          </div>
          <div className="grid gap-0 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              "Configurar autenticação Supabase",
              "Migrar modelo financeiro para Postgres",
              "Reconstruir telas com TanStack Table",
            ].map((item) => (
              <div className="p-5 text-sm text-muted" key={item}>
                {item}
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
