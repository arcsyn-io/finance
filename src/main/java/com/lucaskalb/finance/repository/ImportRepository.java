package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.model.*;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@RequiredArgsConstructor
public class ImportRepository {

    private static final DateTimeFormatter SQLITE_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final DSLContext dsl;

    public long insertRequest(ImportSource source, Long walletId, Long categoryId,
                              EntryNature nature, EconomicEvent economicEvent) {
        dsl.insertInto(table("import_request"))
                .columns(
                    field("status"),
                    field("source"),
                    field("wallet_id"),
                    field("category_id"),
                    field("nature"),
                    field("economic_event")
                )
                .values(
                    ImportStatus.PENDING_REVIEW.name(),
                    source.name(),
                    walletId,
                    categoryId,
                    nature != null ? nature.name() : null,
                    economicEvent != null ? economicEvent.name() : null
                )
                .execute();

        return dsl.select(field("last_insert_rowid()"))
                .fetchOne(0, Long.class);
    }

    public void insertRow(long importRequestId, String description, LocalDateTime occurredAt,
                          long amount, EntryDirection direction, String externalId) {
        dsl.insertInto(table("import_row"))
                .columns(
                    field("import_request_id"),
                    field("description"),
                    field("occurred_at"),
                    field("amount"),
                    field("direction"),
                    field("external_id")
                )
                .values(
                    importRequestId,
                    description,
                    occurredAt.format(SQLITE_DATETIME),
                    amount,
                    direction.name(),
                    externalId
                )
                .execute();
    }

    public Optional<ImportRequest> findRequestById(long id) {
        return dsl.select(
                    field("ir.id"),
                    field("ir.status"),
                    field("ir.source"),
                    field("ir.wallet_id"),
                    field("ir.category_id"),
                    field("ir.nature"),
                    field("ir.economic_event"),
                    field("ir.created_at"),
                    field("ir.confirmed_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("import_request").as("ir"))
                .leftJoin(table("wallet").as("w")).on(field("ir.wallet_id").eq(field("w.id")))
                .leftJoin(table("category").as("c")).on(field("ir.category_id").eq(field("c.id")))
                .where(field("ir.id").eq(id))
                .fetchOptional(this::mapToImportRequest);
    }

    public List<ImportRow> findRowsByRequestId(long requestId) {
        return dsl.select(
                    field("r.id"),
                    field("r.import_request_id"),
                    field("r.description"),
                    field("r.occurred_at"),
                    field("r.amount"),
                    field("r.direction"),
                    field("r.category_id"),
                    field("r.wallet_id"),
                    field("r.nature"),
                    field("r.economic_event"),
                    field("r.external_id"),
                    field("r.valid"),
                    field("r.validation_errors"),
                    field("c.name").as("category_name"),
                    field("w.name").as("wallet_name")
                )
                .from(table("import_row").as("r"))
                .leftJoin(table("category").as("c")).on(field("r.category_id").eq(field("c.id")))
                .leftJoin(table("wallet").as("w")).on(field("r.wallet_id").eq(field("w.id")))
                .where(field("r.import_request_id").eq(requestId))
                .orderBy(field("r.occurred_at").desc(), field("r.id").asc())
                .fetch(this::mapToImportRow);
    }

    public Optional<ImportRow> findRowById(long id) {
        return dsl.select(
                    field("r.id"),
                    field("r.import_request_id"),
                    field("r.description"),
                    field("r.occurred_at"),
                    field("r.amount"),
                    field("r.direction"),
                    field("r.category_id"),
                    field("r.wallet_id"),
                    field("r.nature"),
                    field("r.economic_event"),
                    field("r.external_id"),
                    field("r.valid"),
                    field("r.validation_errors"),
                    field("c.name").as("category_name"),
                    field("w.name").as("wallet_name")
                )
                .from(table("import_row").as("r"))
                .leftJoin(table("category").as("c")).on(field("r.category_id").eq(field("c.id")))
                .leftJoin(table("wallet").as("w")).on(field("r.wallet_id").eq(field("w.id")))
                .where(field("r.id").eq(id))
                .fetchOptional(this::mapToImportRow);
    }

    public void updateRow(long id, String description, LocalDateTime occurredAt, long amount,
                          Long categoryId, Long walletId, EntryNature nature, EconomicEvent economicEvent) {
        dsl.update(table("import_row"))
                .set(field("description"), description)
                .set(field("occurred_at"), occurredAt.format(SQLITE_DATETIME))
                .set(field("amount"), amount)
                .set(field("category_id"), categoryId)
                .set(field("wallet_id"), walletId)
                .set(field("nature"), nature != null ? nature.name() : null)
                .set(field("economic_event"), economicEvent != null ? economicEvent.name() : null)
                .where(field("id").eq(id))
                .execute();
    }

    public void deleteRow(long id) {
        dsl.deleteFrom(table("import_row"))
                .where(field("id").eq(id))
                .execute();
    }

    public void updateRowDescription(long id, String description) {
        dsl.update(table("import_row"))
                .set(field("description"), description)
                .where(field("id").eq(id))
                .execute();
    }

    public void updateRowWallet(long id, Long walletId) {
        dsl.update(table("import_row"))
                .set(field("wallet_id"), walletId)
                .where(field("id").eq(id))
                .execute();
    }

    public void updateRowCategory(long id, Long categoryId) {
        dsl.update(table("import_row"))
                .set(field("category_id"), categoryId)
                .where(field("id").eq(id))
                .execute();
    }

    public void updateRowNature(long id, EntryNature nature) {
        dsl.update(table("import_row"))
                .set(field("nature"), nature != null ? nature.name() : null)
                .where(field("id").eq(id))
                .execute();
    }

    public void updateRowEconomicEvent(long id, EconomicEvent economicEvent) {
        dsl.update(table("import_row"))
                .set(field("economic_event"), economicEvent != null ? economicEvent.name() : null)
                .where(field("id").eq(id))
                .execute();
    }

    public void confirmRequest(long id) {
        dsl.update(table("import_request"))
                .set(field("status"), ImportStatus.CONFIRMED.name())
                .set(field("confirmed_at"), LocalDateTime.now().format(SQLITE_DATETIME))
                .where(field("id").eq(id))
                .execute();
    }

    public void deleteRequest(long id) {
        dsl.deleteFrom(table("import_row"))
                .where(field("import_request_id").eq(id))
                .execute();

        dsl.deleteFrom(table("import_request"))
                .where(field("id").eq(id))
                .execute();
    }

    public List<ImportRequest> listPending() {
        return dsl.select(
                    field("ir.id"),
                    field("ir.status"),
                    field("ir.source"),
                    field("ir.wallet_id"),
                    field("ir.category_id"),
                    field("ir.nature"),
                    field("ir.economic_event"),
                    field("ir.created_at"),
                    field("ir.confirmed_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("import_request").as("ir"))
                .leftJoin(table("wallet").as("w")).on(field("ir.wallet_id").eq(field("w.id")))
                .leftJoin(table("category").as("c")).on(field("ir.category_id").eq(field("c.id")))
                .where(field("ir.status").eq(ImportStatus.PENDING_REVIEW.name()))
                .orderBy(field("ir.created_at").desc())
                .fetch(this::mapToImportRequest);
    }

    public int countRowsByRequestId(long requestId) {
        return dsl.selectCount()
                .from(table("import_row"))
                .where(field("import_request_id").eq(requestId))
                .fetchOne(0, Integer.class);
    }

    private ImportRequest mapToImportRequest(Record record) {
        var walletId = record.get(field("ir.wallet_id", Integer.class));
        var categoryId = record.get(field("ir.category_id", Integer.class));
        var nature = record.get(field("ir.nature", String.class));
        var economicEvent = record.get(field("ir.economic_event", String.class));

        return ImportRequest.builder()
                .id(record.get(field("ir.id", Integer.class)).longValue())
                .status(ImportStatus.valueOf(record.get(field("ir.status", String.class))))
                .source(ImportSource.valueOf(record.get(field("ir.source", String.class))))
                .walletId(walletId != null ? walletId.longValue() : null)
                .categoryId(categoryId != null ? categoryId.longValue() : null)
                .nature(nature != null ? EntryNature.valueOf(nature) : null)
                .economicEvent(economicEvent != null ? EconomicEvent.valueOf(economicEvent) : null)
                .createdAt(parseDateTime(record.get(field("ir.created_at", String.class))))
                .confirmedAt(parseDateTime(record.get(field("ir.confirmed_at", String.class))))
                .walletName(record.get(field("wallet_name", String.class)))
                .categoryName(record.get(field("category_name", String.class)))
                .build();
    }

    private ImportRow mapToImportRow(Record record) {
        var categoryId = record.get(field("r.category_id", Integer.class));
        var walletId = record.get(field("r.wallet_id", Integer.class));
        var nature = record.get(field("r.nature", String.class));
        var economicEvent = record.get(field("r.economic_event", String.class));

        return ImportRow.builder()
                .id(record.get(field("r.id", Integer.class)).longValue())
                .importRequestId(record.get(field("r.import_request_id", Integer.class)).longValue())
                .description(record.get(field("r.description", String.class)))
                .occurredAt(parseDateTime(record.get(field("r.occurred_at", String.class))))
                .amount(record.get(field("r.amount", Integer.class)).longValue())
                .direction(EntryDirection.valueOf(record.get(field("r.direction", String.class))))
                .categoryId(categoryId != null ? categoryId.longValue() : null)
                .walletId(walletId != null ? walletId.longValue() : null)
                .nature(nature != null ? EntryNature.valueOf(nature) : null)
                .economicEvent(economicEvent != null ? EconomicEvent.valueOf(economicEvent) : null)
                .externalId(record.get(field("r.external_id", String.class)))
                .valid(record.get(field("r.valid", Integer.class)) == 1)
                .validationErrors(record.get(field("r.validation_errors", String.class)))
                .categoryName(record.get(field("category_name", String.class)))
                .walletName(record.get(field("wallet_name", String.class)))
                .build();
    }

    private LocalDateTime parseDateTime(String datetime) {
        return datetime != null ? LocalDateTime.parse(datetime, SQLITE_DATETIME) : null;
    }
}
