package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.model.Entry;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;
import static org.jooq.impl.DSL.trueCondition;

@Repository
@RequiredArgsConstructor
public class EntryRepository {

    private static final DateTimeFormatter SQLITE_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final DSLContext dsl;

    public List<Entry> listByPeriod(LocalDateTime startDate, LocalDateTime endDate,
                                     Long walletId, Long categoryId, EntryNature nature,
                                     boolean includeDeleted) {
        Condition condition = trueCondition();

        if (!includeDeleted) {
            condition = condition.and(field("e.deleted_at").isNull());
        }
        if (startDate != null) {
            condition = condition.and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)));
        }
        if (endDate != null) {
            condition = condition.and(field("e.occurred_at").le(endDate.format(SQLITE_DATETIME)));
        }
        if (walletId != null) {
            condition = condition.and(field("e.wallet_id").eq(walletId));
        }
        if (categoryId != null) {
            condition = condition.and(field("e.category_id").eq(categoryId));
        }
        if (nature != null) {
            condition = condition.and(field("e.nature").eq(nature.name()));
        }

        return dsl.select(
                    field("e.id"),
                    field("e.wallet_id"),
                    field("e.category_id"),
                    field("e.nature"),
                    field("e.direction"),
                    field("e.amount"),
                    field("e.occurred_at"),
                    field("e.description"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(condition)
                .orderBy(field("e.occurred_at").desc(), field("e.description").asc())
                .fetch(this::mapToEntry);
    }

    public Optional<Entry> findById(long id) {
        return dsl.select(
                    field("e.id"),
                    field("e.wallet_id"),
                    field("e.category_id"),
                    field("e.nature"),
                    field("e.direction"),
                    field("e.amount"),
                    field("e.occurred_at"),
                    field("e.description"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.id").eq(id))
                .fetchOptional(this::mapToEntry);
    }

    public void softDelete(long id) {
        dsl.update(table("entry"))
                .set(field("deleted_at"), LocalDateTime.now().format(SQLITE_DATETIME))
                .where(field("id").eq(id))
                .execute();
    }

    public void restore(long id) {
        dsl.update(table("entry"))
                .setNull(field("deleted_at"))
                .where(field("id").eq(id))
                .execute();
    }

    public long insert(long walletId, long categoryId, EntryNature nature, EntryDirection direction,
                       long amount, LocalDateTime occurredAt, String description) {
        dsl.insertInto(table("entry"))
                .columns(
                    field("wallet_id"),
                    field("category_id"),
                    field("nature"),
                    field("direction"),
                    field("amount"),
                    field("occurred_at"),
                    field("description")
                )
                .values(
                    walletId,
                    categoryId,
                    nature.name(),
                    direction.name(),
                    amount,
                    occurredAt.format(SQLITE_DATETIME),
                    description
                )
                .execute();

        return dsl.select(field("last_insert_rowid()"))
                .fetchOne(0, Long.class);
    }

    public void update(long id, long walletId, long categoryId, EntryNature nature, EntryDirection direction,
                       long amount, LocalDateTime occurredAt, String description) {
        dsl.update(table("entry"))
                .set(field("wallet_id"), walletId)
                .set(field("category_id"), categoryId)
                .set(field("nature"), nature.name())
                .set(field("direction"), direction.name())
                .set(field("amount"), amount)
                .set(field("occurred_at"), occurredAt.format(SQLITE_DATETIME))
                .set(field("description"), description)
                .where(field("id").eq(id))
                .execute();
    }

    private Entry mapToEntry(Record record) {
        return Entry.builder()
                .id(record.get(field("e.id", Integer.class)).longValue())
                .walletId(record.get(field("e.wallet_id", Integer.class)).longValue())
                .categoryId(record.get(field("e.category_id", Integer.class)).longValue())
                .nature(EntryNature.valueOf(record.get(field("e.nature", String.class))))
                .direction(EntryDirection.valueOf(record.get(field("e.direction", String.class))))
                .amount(record.get(field("e.amount", Integer.class)).longValue())
                .occurredAt(parseDateTime(record.get(field("e.occurred_at", String.class))))
                .description(record.get(field("e.description", String.class)))
                .createdAt(parseDateTime(record.get(field("e.created_at", String.class))))
                .deletedAt(parseDateTime(record.get(field("e.deleted_at", String.class))))
                .walletName(record.get(field("wallet_name", String.class)))
                .categoryName(record.get(field("category_name", String.class)))
                .build();
    }

    private LocalDateTime parseDateTime(String datetime) {
        return datetime != null ? LocalDateTime.parse(datetime, SQLITE_DATETIME) : null;
    }
}
