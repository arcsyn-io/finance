package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.EconomicEvent;
import com.lucaskalb.finance.model.EntryNature;

public record ImportSuggestion(
        Long categoryId,
        EntryNature nature,
        EconomicEvent economicEvent,
        int confidence
) {
    public static ImportSuggestion empty() {
        return new ImportSuggestion(null, null, null, 0);
    }
}
