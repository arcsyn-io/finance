package com.lucaskalb.finance.dto;

import java.time.YearMonth;

public record MonthlyConsumption(
        YearMonth month,
        long categoryId,
        String categoryName,
        long amount
) {}
