package com.lucaskalb.finance.exception;

public class DuplicateCategoryNameException extends RuntimeException {
    public DuplicateCategoryNameException() {
        super("Já existe uma categoria com este nome");
    }

    public DuplicateCategoryNameException(String message) {
        super(message);
    }
}
