package com.lucaskalb.finance.exception;

public class EntryNotFoundException extends RuntimeException {
    public EntryNotFoundException(long id) {
        super("Lançamento não encontrado: " + id);
    }
}
