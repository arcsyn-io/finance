package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.CategoryType;

public record CreateCategoryCommand(
        String name,
        CategoryType type
) {}
