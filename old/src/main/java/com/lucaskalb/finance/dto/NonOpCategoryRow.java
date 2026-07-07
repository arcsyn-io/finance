package com.lucaskalb.finance.dto;

import java.util.List;

public record NonOpCategoryRow(
    long categoryId,
    String categoryName,
    List<Long> monthlyAmounts
) {
    public long total() {
        return monthlyAmounts.stream().mapToLong(Long::longValue).sum();
    }
}
