package com.lucaskalb.finance.exception;

public class ImportNotFoundException extends RuntimeException {
    public ImportNotFoundException(long id) {
        super("Importação não encontrada: " + id);
    }
}
