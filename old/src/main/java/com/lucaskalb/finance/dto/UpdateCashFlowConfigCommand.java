package com.lucaskalb.finance.dto;

import java.time.YearMonth;

public record UpdateCashFlowConfigCommand(
    YearMonth referenceMonth,
    long openingBalance,
    long minimumCash
) {}
