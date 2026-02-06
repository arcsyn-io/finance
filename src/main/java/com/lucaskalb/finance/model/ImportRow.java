package com.lucaskalb.finance.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ImportRow {
    private Long id;
    private Long importRequestId;
    private String description;
    private LocalDateTime occurredAt;
    private long amount; // valor em centavos
    private EntryDirection direction;
    private Long categoryId;
    private Long walletId;
    private EntryNature nature;
    private String externalId;
    private boolean valid;
    private String validationErrors;

    // Campos auxiliares para exibição
    private String categoryName;
    private String walletName;
}
