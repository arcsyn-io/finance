package com.lucaskalb.finance.exception;

public class InvalidWalletException extends RuntimeException {
    public InvalidWalletException(String message) {
        super(message);
    }
}
