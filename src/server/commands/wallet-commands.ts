import type { WalletType } from "../../domain/wallet/wallet";

export type ListWalletsCommand = {
  readonly includeInactive: boolean;
};

export type CreateWalletCommand = {
  readonly name: string;
  readonly type?: WalletType;
  readonly initialBalanceCents?: number;
  readonly active?: boolean;
};

export type UpdateWalletCommand = {
  readonly id: string;
  readonly name: string;
  readonly type?: WalletType;
  readonly initialBalanceCents: number;
  readonly active: boolean;
};

export type SetWalletActiveCommand = {
  readonly id: string;
};
