package com.lucaskalb.finance.dto;

public record CategoryConsumption(
        long categoryId,
        String categoryName,
        long totalConsumed
) {}
