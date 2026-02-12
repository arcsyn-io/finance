package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.EconomicEvent;
import com.lucaskalb.finance.model.EntryNature;

import java.time.LocalDateTime;

public record UpdateEntryCommand(
    long id,
    long walletId,
    long categoryId,
    EntryNature nature,
    EconomicEvent economicEvent,
    long amount,
    LocalDateTime occurredAt,
    String description
) {}
