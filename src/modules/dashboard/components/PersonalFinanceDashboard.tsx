import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  CreditCard,
  Landmark,
  ListPlus,
  PiggyBank,
  WalletCards,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PersonalDashboardViewModel } from "@/modules/dashboard/view-models/personal-dashboard-view-model";

type PersonalFinanceDashboardProps = {
  readonly viewModel: PersonalDashboardViewModel;
};

export function PersonalFinanceDashboard({
  viewModel,
}: PersonalFinanceDashboardProps) {
  return (
    <div className="flex w-full flex-col gap-5 lg:gap-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
            Posição atual
          </p>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
            Painel financeiro pessoal
          </h1>
          <p className="mt-1 max-w-3xl text-xs leading-5 text-muted">
            Acompanhe liquidez, patrimônio e movimentações recentes. O resultado
            operacional mensal continua na análise de fluxo de caixa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/wallets">
              <WalletCards aria-hidden="true" />
              Carteiras
            </Link>
          </Button>
          <Button asChild>
            <Link href="/transactions">
              <ListPlus aria-hidden="true" />
              Novo lançamento
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {viewModel.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Composição patrimonial</CardTitle>
            <CardDescription>
              Valores atuais por classe de carteira, sem confundir posição e fluxo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {viewModel.allocation.map((item) => (
              <div className="grid gap-2" key={item.label}>
                <div className="flex items-center justify-between gap-4 text-xs">
                  <span className="text-muted">{item.label}</span>
                  <strong className={toneClass(item.tone)}>{item.value}</strong>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className={`h-full rounded-full ${barClass(item.tone)}`}
                    style={{ width: `${item.proportion}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Requer atenção</CardTitle>
            <CardDescription>
              Saldos negativos fora de cartões de crédito.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewModel.negativeWallets.length > 0 ? (
              <ul className="grid gap-2">
                {viewModel.negativeWallets.map((wallet) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-md border border-negative/30 bg-negative/10 px-3 py-2.5"
                    key={wallet.id}
                  >
                    <span className="flex min-w-0 items-center gap-2 text-xs font-medium">
                      <AlertTriangle className="size-3.5 shrink-0 text-negative" aria-hidden="true" />
                      <span className="truncate">{wallet.name}</span>
                    </span>
                    <strong className="shrink-0 text-xs tabular-nums text-negative">
                      {wallet.balance}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState text="Nenhuma carteira ativa está com saldo negativo." />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-3 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Carteiras ativas</CardTitle>
              <CardDescription>Posição individual por tipo de carteira.</CardDescription>
            </div>
            <Building2 className="size-4 text-muted" aria-hidden="true" />
          </CardHeader>
          <CardContent className="p-0">
            {viewModel.hasWallets ? (
              <ul className="divide-y divide-border">
                {viewModel.wallets.map((wallet) => (
                  <li key={wallet.id}>
                    <Link
                      className="flex items-center justify-between gap-4 px-4 py-3 transition hover:bg-surface-elevated"
                      href={`/wallets/${wallet.id}`}
                    >
                      <span className="min-w-0">
                        <strong className="block truncate text-xs font-medium">{wallet.name}</strong>
                        <span className="mt-0.5 block text-[10px] text-muted">{wallet.typeLabel}</span>
                      </span>
                      <strong className={`shrink-0 text-xs tabular-nums ${toneClass(wallet.tone)}`}>
                        {wallet.balance}
                      </strong>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState text="Cadastre uma carteira para acompanhar sua posição financeira." />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div>
              <CardTitle>Últimos lançamentos</CardTitle>
              <CardDescription>Fatos financeiros registrados mais recentemente.</CardDescription>
            </div>
            <CreditCard className="size-4 text-muted" aria-hidden="true" />
          </CardHeader>
          <CardContent className="p-0">
            {viewModel.recentEntries.length > 0 ? (
              <ul className="divide-y divide-border">
                {viewModel.recentEntries.map((entry) => (
                  <li className="flex items-center justify-between gap-4 px-4 py-3" key={entry.id}>
                    <span className="min-w-0">
                      <strong className="block truncate text-xs font-medium">{entry.description}</strong>
                      <span className="mt-0.5 block truncate text-[10px] text-muted">{entry.detail}</span>
                    </span>
                    <strong className={`flex shrink-0 items-center gap-1 text-xs tabular-nums ${toneClass(entry.tone)}`}>
                      {entry.tone === "positive" ? (
                        <ArrowUpRight className="size-3" aria-hidden="true" />
                      ) : (
                        <ArrowDownRight className="size-3" aria-hidden="true" />
                      )}
                      {entry.amount}
                    </strong>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4">
                <EmptyState text="Os lançamentos registrados aparecerão aqui." />
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  metric,
}: {
  readonly metric: PersonalDashboardViewModel["metrics"][number];
}) {
  const Icon =
    metric.label === "Liquidez real"
      ? WalletCards
      : metric.label === "Patrimônio líquido"
        ? Landmark
        : metric.label === "Investimentos"
          ? PiggyBank
          : CreditCard;

  return (
    <Card className={metric.tone === "negative" ? "border-negative/30" : undefined}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            {metric.label}
          </p>
          <Icon className={`size-3.5 ${toneClass(metric.tone)}`} aria-hidden="true" />
        </div>
        <strong className={`mt-3 block text-lg font-bold tabular-nums md:text-xl ${toneClass(metric.tone)}`}>
          {metric.value}
        </strong>
        <p className="mt-2 min-h-8 text-[10px] leading-4 text-muted">{metric.detail}</p>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { readonly text: string }) {
  return <p className="rounded-md bg-surface px-3 py-4 text-center text-xs leading-5 text-muted">{text}</p>;
}

function toneClass(tone: "default" | "negative" | "positive"): string {
  if (tone === "negative") return "text-negative";
  if (tone === "positive") return "text-positive";
  return "text-foreground";
}

function barClass(tone: "default" | "negative" | "positive"): string {
  if (tone === "negative") return "bg-negative";
  if (tone === "positive") return "bg-positive";
  return "bg-accent";
}
