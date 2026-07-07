package com.lucaskalb.finance.dto;

import java.time.LocalDateTime;

public record CreateTransferCommand(
    long fromWalletId,
    long toWalletId,
    long fromCategoryId,
    long toCategoryId,
    long amount,
    LocalDateTime occurredAt,
    String description
) {}
