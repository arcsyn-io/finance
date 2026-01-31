package com.lucaskalb.finance.exception;

public class WalletNotFoundException extends RuntimeException {
    public WalletNotFoundException() {
        super("Carteira não encontrada");
    }

    public WalletNotFoundException(long id) {
        super("Carteira não encontrada: " + id);
    }
}
