package com.lucaskalb.finance.exception;

public class DuplicateWalletNameException extends RuntimeException {
    public DuplicateWalletNameException() {
        super("Já existe uma carteira com este nome");
    }
}
