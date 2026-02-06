package com.lucaskalb.finance.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class Entry {
    private Long id;
    private Long walletId;
    private Long categoryId;
    private EntryNature nature;
    private EntryDirection direction;
    private long amount; // valor em centavos
    private LocalDateTime occurredAt;
    private String description;
    private String externalId; // identificador externo (único por carteira)
    private LocalDateTime createdAt;
    private LocalDateTime deletedAt;

    // Campos auxiliares para exibição (preenchidos via join)
    private String walletName;
    private String categoryName;

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
