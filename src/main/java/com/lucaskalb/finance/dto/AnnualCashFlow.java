package com.lucaskalb.finance.dto;

import java.util.List;

public record AnnualCashFlow(
    int year,
    List<MonthlyCashFlow> months // sempre 12 elementos, de janeiro a dezembro
) {}
