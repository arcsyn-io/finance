package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.EntryNature;

import java.time.LocalDateTime;

public record CreateEntryCommand(
    long walletId,
    long categoryId,
    EntryNature nature,
    long amount,
    LocalDateTime occurredAt,
    String description
) {}
