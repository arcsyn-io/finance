import { walletTypeLabels } from "@/domain/wallet/wallet";
import type { PersonalDashboardDto } from "@/server/dto/dashboard-dto";
import type { PersonalDashboardViewModel } from "@/modules/dashboard/view-models/personal-dashboard-view-model";

export function personalDashboardDtoToViewModel(
  dashboard: PersonalDashboardDto,
): PersonalDashboardViewModel {
  const allocationValues = [
    {
      label: "Liquidez disponível",
      valueInCents: dashboard.realLiquidityCents,
      tone: "positive" as const,
    },
    {
      label: "Investimentos financeiros",
      valueInCents: dashboard.financialInvestmentsCents,
      tone: "default" as const,
    },
    {
      label: "Bens patrimoniais",
      valueInCents: dashboard.assetCents,
      tone: "default" as const,
    },
    {
      label: "Dívida no cartão",
      valueInCents: dashboard.creditCardDebtCents,
      tone: "negative" as const,
    },
  ];
  const allocationBase = Math.max(
    1,
    ...allocationValues.map((item) => Math.abs(item.valueInCents)),
  );

  return {
    hasWallets: dashboard.wallets.length > 0,
    metrics: [
      {
        label: "Liquidez real",
        value: formatMoney(dashboard.realLiquidityCents),
        detail: "Recursos disponíveis nas carteiras de caixa",
        tone: dashboard.realLiquidityCents < 0 ? "negative" : "positive",
      },
      {
        label: "Patrimônio líquido",
        value: formatMoney(dashboard.netWorthCents),
        detail: "Ativos e passivos em todas as carteiras ativas",
        tone: dashboard.netWorthCents < 0 ? "negative" : "default",
      },
      {
        label: "Investimentos",
        value: formatMoney(dashboard.financialInvestmentsCents),
        detail: "Títulos negociáveis e posições de longo prazo",
        tone:
          dashboard.financialInvestmentsCents < 0 ? "negative" : "default",
      },
      {
        label: "Dívida no cartão",
        value: formatMoney(dashboard.creditCardDebtCents),
        detail: "Saldo devedor atual das carteiras de cartão",
        tone: dashboard.creditCardDebtCents > 0 ? "negative" : "positive",
      },
    ],
    allocation: allocationValues.map((item) => ({
      label: item.label,
      value: formatMoney(item.valueInCents),
      tone: item.tone,
      proportion: Math.round((Math.abs(item.valueInCents) / allocationBase) * 100),
    })),
    wallets: dashboard.wallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      typeLabel: walletTypeLabels[wallet.type],
      balance: formatMoney(wallet.balanceCents),
      tone: wallet.balanceCents < 0 ? "negative" : "default",
    })),
    negativeWallets: dashboard.negativeWallets.map((wallet) => ({
      id: wallet.id,
      name: wallet.name,
      balance: formatMoney(wallet.balanceCents),
    })),
    recentEntries: dashboard.recentEntries.map((entry) => ({
      id: entry.id,
      description: entry.description ?? "Lançamento sem descrição",
      detail: `${formatShortDate(entry.occurredOn)} · ${entry.walletName}${entry.categoryName ? ` · ${entry.categoryName}` : ""}`,
      amount: `${entry.direction === "IN" ? "+" : "−"} ${formatMoney(entry.amountCents)}`,
      tone: entry.direction === "IN" ? "positive" : "negative",
    })),
  };
}

function formatMoney(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

function formatShortDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}
