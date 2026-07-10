import type { WalletType } from "../../../domain/wallet/wallet";
import { InvalidWalletError } from "../../../domain/wallet/wallet-errors";

export function validateAndNormalizeWalletName(name: string): string {
  if (!name || !name.trim()) {
    throw new InvalidWalletError("Nome da carteira e obrigatorio");
  }

  return name.trim();
}

export function validateWalletType(type: WalletType | undefined): WalletType {
  if (!type) {
    throw new InvalidWalletError("Tipo da carteira e obrigatorio");
  }

  return type;
}

export function normalizeInitialBalanceCents(
  value: number | undefined,
): number {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isInteger(value)) {
    throw new InvalidWalletError(
      "Saldo inicial deve ser informado em centavos",
    );
  }

  return value;
}
