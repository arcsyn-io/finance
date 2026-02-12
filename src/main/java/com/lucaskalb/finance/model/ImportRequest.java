package com.lucaskalb.finance.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ImportRequest {
    private Long id;
    private ImportStatus status;
    private ImportSource source;
    private Long walletId;
    private Long categoryId;
    private EntryNature nature;
    private EconomicEvent economicEvent;
    private LocalDateTime createdAt;
    private LocalDateTime confirmedAt;

    // Campos auxiliares
    private String walletName;
    private String categoryName;
    private List<ImportRow> rows;
}
