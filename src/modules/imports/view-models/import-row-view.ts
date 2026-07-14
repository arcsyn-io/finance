import type { ImportRow } from "../../../domain/import/import";

export type ImportRowsViewMode = "status" | "date";

export type ImportRowViewStatus = "pending" | "ready" | "ignored";

export type ImportRowReadinessDefaults = {
  readonly defaultWalletId: string | null;
  readonly defaultCategoryId: string | null;
  readonly nature: string | null;
};

export type ImportRowStatusGroup = {
  readonly key: ImportRowViewStatus;
  readonly label: string;
  readonly count: number;
  readonly rows: readonly ImportRow[];
};

const statusOrder: readonly ImportRowViewStatus[] = [
  "pending",
  "ready",
  "ignored",
];

export const importRowStatusLabels: Record<ImportRowViewStatus, string> = {
  pending: "Pendente",
  ready: "Concluido",
  ignored: "Ignorada",
};

export function getImportRowViewStatus(
  row: ImportRow,
  defaults: ImportRowReadinessDefaults = {
    defaultWalletId: null,
    defaultCategoryId: null,
    nature: null,
  },
): ImportRowViewStatus {
  if (row.ignoredAt) return "ignored";
  if (
    row.entryId ||
    ((row.walletId ?? defaults.defaultWalletId) &&
      (row.categoryId ?? defaults.defaultCategoryId) &&
      (row.nature ?? defaults.nature))
  ) {
    return "ready";
  }

  return "pending";
}

export function getVisibleImportRowStatus(
  row: ImportRow,
  defaults?: ImportRowReadinessDefaults,
  statusBeforeEditing?: ImportRowViewStatus,
): ImportRowViewStatus {
  return statusBeforeEditing ?? getImportRowViewStatus(row, defaults);
}

export function orderImportRowsByDate(
  rows: readonly ImportRow[],
): readonly ImportRow[] {
  return [...rows].sort((left, right) => {
    const dateComparison = left.occurredOn.localeCompare(right.occurredOn);
    if (dateComparison !== 0) return dateComparison;
    return left.rowNumber - right.rowNumber;
  });
}

export function groupImportRowsByStatus(
  rows: readonly ImportRow[],
  defaults?: ImportRowReadinessDefaults,
  statusBeforeEditingByRow?: ReadonlyMap<string, ImportRowViewStatus>,
): readonly ImportRowStatusGroup[] {
  const orderedRows = orderImportRowsByDate(rows);

  return statusOrder
    .map((status) => {
      const groupRows = orderedRows.filter(
        (row) =>
          getVisibleImportRowStatus(
            row,
            defaults,
            statusBeforeEditingByRow?.get(row.id),
          ) === status,
      );

      return {
        key: status,
        label: importRowStatusLabels[status],
        count: groupRows.length,
        rows: groupRows,
      };
    })
    .filter((group) => group.count > 0);
}
