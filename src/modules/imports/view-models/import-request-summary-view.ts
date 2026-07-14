import type {
  ImportRequest,
  ImportRequestSummary,
} from "@/domain/import/import";

export function toImportRequestSummaryView(
  request: ImportRequest,
): ImportRequestSummary {
  return {
    id: request.id,
    source: request.source,
    status: request.status,
    fileName: request.fileName,
    createdAt: request.createdAt,
    totalRows: request.rows.length,
    pendingRows: request.rows.filter(
      (row) => !row.entryId && !row.ignoredAt,
    ).length,
    ignoredRows: request.rows.filter((row) => row.ignoredAt).length,
  };
}
