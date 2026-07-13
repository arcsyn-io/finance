import type { Entry } from "@/domain/entry/entry";

export type MobileEntryViewModel = {
  readonly occurredOn: string;
  readonly categoryName: string;
  readonly description: string | null;
  readonly signedAmountCents: number;
  readonly actionLabels: readonly string[];
};

export function createMobileEntryViewModel(entry: Entry): MobileEntryViewModel {
  const deleted = Boolean(entry.deletedAt);
  const signedAmountCents =
    entry.direction === "OUT" ? -entry.amountCents : entry.amountCents;

  return {
    occurredOn: entry.occurredOn,
    categoryName: entry.categoryName ?? "Sem categoria",
    description: entry.description,
    signedAmountCents,
    actionLabels: deleted
      ? ["Restaurar lançamento", "Abrir anexos"]
      : [
          "Editar lançamento",
          "Excluir lançamento",
          entry.transferId
            ? "Desvincular transferência"
            : "Vincular transferência",
          "Abrir anexos",
        ],
  };
}
