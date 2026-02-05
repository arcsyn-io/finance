package com.lucaskalb.finance.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.time.YearMonth;

@Data
@Builder
public class CashFlowConfig {
    private Long id;
    private YearMonth referenceMonth;
    private long openingBalance; // saldo inicial em centavos
    private long minimumCash;    // caixa mínimo em centavos
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
