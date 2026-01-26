package com.lucaskalb.finance.exception;

public class AuthenticationFailedException extends RuntimeException {
    public AuthenticationFailedException() {
        super("Credenciais inválidas");
    }
}
