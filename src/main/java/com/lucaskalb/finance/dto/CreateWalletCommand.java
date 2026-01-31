package com.lucaskalb.finance.dto;

import com.lucaskalb.finance.model.WalletType;

public record CreateWalletCommand(
        String name,
        WalletType type
) {}
