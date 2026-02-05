package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.model.Transfer;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@RequiredArgsConstructor
public class TransferRepository {

    private static final DateTimeFormatter SQLITE_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final DSLContext dsl;

    public long insert(long fromWalletId, long toWalletId, long fromCategoryId, long toCategoryId,
                       long amount, LocalDateTime occurredAt, String description) {
        dsl.insertInto(table("transfer"))
                .columns(
                    field("from_wallet_id"),
                    field("to_wallet_id"),
                    field("from_category_id"),
                    field("to_category_id"),
                    field("amount"),
                    field("occurred_at"),
                    field("description")
                )
                .values(
                    fromWalletId,
                    toWalletId,
                    fromCategoryId,
                    toCategoryId,
                    amount,
                    occurredAt.format(SQLITE_DATETIME),
                    description
                )
                .execute();

        return dsl.select(field("last_insert_rowid()"))
                .fetchOne(0, Long.class);
    }

    public Optional<Transfer> findById(long id) {
        return dsl.select(
                    field("t.id"),
                    field("t.from_wallet_id"),
                    field("t.to_wallet_id"),
                    field("t.from_category_id"),
                    field("t.to_category_id"),
                    field("t.amount"),
                    field("t.occurred_at"),
                    field("t.description"),
                    field("t.created_at"),
                    field("fw.name").as("from_wallet_name"),
                    field("tw.name").as("to_wallet_name"),
                    field("fc.name").as("from_category_name"),
                    field("tc.name").as("to_category_name")
                )
                .from(table("transfer").as("t"))
                .join(table("wallet").as("fw")).on(field("t.from_wallet_id").eq(field("fw.id")))
                .join(table("wallet").as("tw")).on(field("t.to_wallet_id").eq(field("tw.id")))
                .join(table("category").as("fc")).on(field("t.from_category_id").eq(field("fc.id")))
                .join(table("category").as("tc")).on(field("t.to_category_id").eq(field("tc.id")))
                .where(field("t.id").eq(id))
                .fetchOptional(this::mapToTransfer);
    }

    private Transfer mapToTransfer(Record record) {
        return Transfer.builder()
                .id(record.get(field("t.id", Integer.class)).longValue())
                .fromWalletId(record.get(field("t.from_wallet_id", Integer.class)).longValue())
                .toWalletId(record.get(field("t.to_wallet_id", Integer.class)).longValue())
                .fromCategoryId(record.get(field("t.from_category_id", Integer.class)).longValue())
                .toCategoryId(record.get(field("t.to_category_id", Integer.class)).longValue())
                .amount(record.get(field("t.amount", Integer.class)).longValue())
                .occurredAt(parseDateTime(record.get(field("t.occurred_at", String.class))))
                .description(record.get(field("t.description", String.class)))
                .createdAt(parseDateTime(record.get(field("t.created_at", String.class))))
                .fromWalletName(record.get(field("from_wallet_name", String.class)))
                .toWalletName(record.get(field("to_wallet_name", String.class)))
                .fromCategoryName(record.get(field("from_category_name", String.class)))
                .toCategoryName(record.get(field("to_category_name", String.class)))
                .build();
    }

    private LocalDateTime parseDateTime(String datetime) {
        return datetime != null ? LocalDateTime.parse(datetime, SQLITE_DATETIME) : null;
    }
}
