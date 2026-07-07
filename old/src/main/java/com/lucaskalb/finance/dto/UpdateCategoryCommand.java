package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.CategoryType;

public record UpdateCategoryCommand(
        long id,
        String name,
        CategoryType type,
        boolean active
) {}
