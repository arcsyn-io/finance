package com.lucaskalb.finance.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class Wallet {
    private Long id;
    private String name;
    private WalletType type;
    private boolean active;
    private LocalDateTime createdAt;
}
