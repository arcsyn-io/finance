package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.model.CashFlowConfig;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@RequiredArgsConstructor
public class CashFlowConfigRepository {

    private static final DateTimeFormatter SQLITE_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter YEAR_MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private final DSLContext dsl;

    public Optional<CashFlowConfig> findByMonth(YearMonth month) {
        return dsl.selectFrom(table("cash_flow_config"))
                .where(field("reference_month").eq(month.format(YEAR_MONTH_FORMAT)))
                .fetchOptional(this::mapToConfig);
    }

    public void upsert(YearMonth referenceMonth, long openingBalance, long minimumCash) {
        var now = LocalDateTime.now().format(SQLITE_DATETIME);
        var monthStr = referenceMonth.format(YEAR_MONTH_FORMAT);

        var existing = findByMonth(referenceMonth);
        if (existing.isPresent()) {
            dsl.update(table("cash_flow_config"))
                    .set(field("opening_balance"), openingBalance)
                    .set(field("minimum_cash"), minimumCash)
                    .set(field("updated_at"), now)
                    .where(field("reference_month").eq(monthStr))
                    .execute();
        } else {
            dsl.insertInto(table("cash_flow_config"))
                    .columns(
                        field("reference_month"),
                        field("opening_balance"),
                        field("minimum_cash"),
                        field("updated_at")
                    )
                    .values(monthStr, openingBalance, minimumCash, now)
                    .execute();
        }
    }

    private CashFlowConfig mapToConfig(Record record) {
        return CashFlowConfig.builder()
                .id(record.get(field("id", Integer.class)).longValue())
                .referenceMonth(YearMonth.parse(record.get(field("reference_month", String.class))))
                .openingBalance(record.get(field("opening_balance", Integer.class)).longValue())
                .minimumCash(record.get(field("minimum_cash", Integer.class)).longValue())
                .createdAt(parseDateTime(record.get(field("created_at", String.class))))
                .updatedAt(parseDateTime(record.get(field("updated_at", String.class))))
                .build();
    }

    private LocalDateTime parseDateTime(String datetime) {
        return datetime != null ? LocalDateTime.parse(datetime, SQLITE_DATETIME) : null;
    }
}
