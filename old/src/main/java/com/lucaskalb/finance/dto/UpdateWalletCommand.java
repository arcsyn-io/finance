package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.WalletType;

public record UpdateWalletCommand(
        long id,
        String name,
        WalletType type,
        boolean active
) {}
