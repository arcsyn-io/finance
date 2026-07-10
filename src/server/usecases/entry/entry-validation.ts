import type { Category } from "../../../domain/category/category";
import type {
  EconomicEvent,
  EntryDirection,
  EntryNature,
} from "../../../domain/entry/entry";
import { InvalidEntryError } from "../../../domain/entry/entry-errors";
import type { Wallet, WalletType } from "../../../domain/wallet/wallet";

export function validateAmountCents(amountCents: number): void {
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new InvalidEntryError("Valor deve ser maior que zero");
  }
}

export function validateOccurredOn(occurredOn: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) {
    throw new InvalidEntryError("Data do lancamento e obrigatoria");
  }
}

export function validateNature(nature: EntryNature | undefined): EntryNature {
  if (!nature) {
    throw new InvalidEntryError("Natureza do lancamento e obrigatoria");
  }

  return nature;
}

export function assertWalletAcceptsEntries(wallet: Wallet): void {
  if (!wallet.active) {
    throw new InvalidEntryError("Carteira inativa nao pode receber lancamentos");
  }
}

export function inferDirection(category: Category): EntryDirection {
  return category.type === "INCOME" ? "IN" : "OUT";
}

export function inferEconomicEvent({
  direction,
  nature,
  transferId,
  walletType,
}: {
  readonly walletType: WalletType;
  readonly nature: EntryNature;
  readonly direction: EntryDirection;
  readonly transferId?: string | null;
}): EconomicEvent {
  if (transferId) {
    return "TRANSFER";
  }

  if (
    walletType === "NEGOTIABLE_SECURITY" ||
    walletType === "LONG_TERM" ||
    walletType === "ASSET"
  ) {
    return "INVESTMENT";
  }

  if (nature === "OPERATIONAL" && direction === "OUT" && walletType === "CASH") {
    return "LIQUIDATION";
  }

  if (direction === "OUT") {
    return "CONSUMPTION";
  }

  return "INVESTMENT";
}
