package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.EconomicEvent;
import com.lucaskalb.finance.model.EntryNature;

import java.time.LocalDateTime;

public record UpdateImportRowCommand(
        long id,
        long importRequestId,
        String description,
        LocalDateTime occurredAt,
        long amount,
        Long categoryId,
        Long walletId,
        EntryNature nature,
        EconomicEvent economicEvent
) {}
