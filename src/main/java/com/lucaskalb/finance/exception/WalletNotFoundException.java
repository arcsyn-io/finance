package com.lucaskalb.finance.exception;

public class WalletNotFoundException extends RuntimeException {
    public WalletNotFoundException() {
        super("Carteira não encontrada");
    }
}
