package com.lucaskalb.finance.exception;

public class AccountDisabledException extends RuntimeException {
    public AccountDisabledException() {
        super("Conta desativada");
    }
}
