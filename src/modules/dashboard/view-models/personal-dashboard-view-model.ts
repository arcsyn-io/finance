export type DashboardTone = "default" | "negative" | "positive";

export type PersonalDashboardViewModel = {
  readonly hasWallets: boolean;
  readonly metrics: readonly {
    readonly label: string;
    readonly value: string;
    readonly detail: string;
    readonly tone: DashboardTone;
  }[];
  readonly allocation: readonly {
    readonly label: string;
    readonly value: string;
    readonly tone: DashboardTone;
    readonly proportion: number;
  }[];
  readonly wallets: readonly {
    readonly id: string;
    readonly name: string;
    readonly typeLabel: string;
    readonly balance: string;
    readonly tone: DashboardTone;
  }[];
  readonly negativeWallets: readonly {
    readonly id: string;
    readonly name: string;
    readonly balance: string;
  }[];
  readonly recentEntries: readonly {
    readonly id: string;
    readonly description: string;
    readonly detail: string;
    readonly amount: string;
    readonly tone: DashboardTone;
  }[];
};
