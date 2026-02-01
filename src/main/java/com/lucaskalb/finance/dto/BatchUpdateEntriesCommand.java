package com.lucaskalb.finance.dto;

import java.util.List;

public record BatchUpdateEntriesCommand(
        List<Long> entryIds,
        Long walletId,
        Long categoryId,
        String nature
) {}
