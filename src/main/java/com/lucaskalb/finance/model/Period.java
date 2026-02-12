package com.lucaskalb.finance.model;

public enum Period {
    CURRENT_MONTH("Mês atual"),
    PREVIOUS_MONTH("Mês anterior"),
    THIS_WEEK("Essa semana"),
    TODAY("Hoje"),
    YESTERDAY("Ontem"),
    CUSTOM("Personalizado");

    private final String label;

    Period(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
