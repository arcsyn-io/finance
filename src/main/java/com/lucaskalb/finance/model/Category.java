package com.lucaskalb.finance.model;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class Category {
    private Long id;
    private String name;
    private CategoryType type;
    private boolean active;
    private LocalDateTime createdAt;
}
