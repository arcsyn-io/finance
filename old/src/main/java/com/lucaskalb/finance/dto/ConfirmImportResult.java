package com.lucaskalb.finance.dto;

import java.time.LocalDate;

public record ConfirmImportResult(
        int importedCount,
        int skippedCount,
        LocalDate startDate,
        LocalDate endDate
) {}
