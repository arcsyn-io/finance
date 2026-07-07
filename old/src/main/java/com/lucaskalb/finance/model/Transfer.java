package com.lucaskalb.finance.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class Transfer {
    private Long id;
    private Long fromWalletId;
    private Long toWalletId;
    private Long fromCategoryId;
    private Long toCategoryId;
    private long amount; // valor em centavos
    private LocalDateTime occurredAt;
    private String description;
    private LocalDateTime createdAt;

    // Campos auxiliares para exibição (preenchidos via join)
    private String fromWalletName;
    private String toWalletName;
    private String fromCategoryName;
    private String toCategoryName;
}
