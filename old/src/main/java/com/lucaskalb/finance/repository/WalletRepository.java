package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.model.Wallet;
import com.lucaskalb.finance.model.WalletType;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.lower;
import static org.jooq.impl.DSL.table;

@Repository
@RequiredArgsConstructor
public class WalletRepository {

    private static final DateTimeFormatter SQLITE_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final DSLContext dsl;

    public List<Wallet> listAll(boolean includeInactive) {
        if (includeInactive) {
            return dsl.selectFrom(table("wallet"))
                    .orderBy(field("name"))
                    .fetch(this::mapToWallet);
        }
        return dsl.selectFrom(table("wallet"))
                .where(field("active").eq(1))
                .orderBy(field("name"))
                .fetch(this::mapToWallet);
    }

    public Optional<Wallet> findById(long id) {
        return dsl.selectFrom(table("wallet"))
                .where(field("id").eq(id))
                .fetchOptional(this::mapToWallet);
    }

    public Optional<Wallet> findByName(String name) {
        return dsl.selectFrom(table("wallet"))
                .where(lower(field("name", String.class)).eq(name.toLowerCase()))
                .fetchOptional(this::mapToWallet);
    }

    public long insert(String name, WalletType type) {
        dsl.insertInto(table("wallet"))
                .columns(field("name"), field("type"))
                .values(name, type.name())
                .execute();

        return dsl.select(field("last_insert_rowid()"))
                .fetchOne(0, Long.class);
    }

    public void update(long id, String name, WalletType type, boolean active) {
        dsl.update(table("wallet"))
                .set(field("name"), name)
                .set(field("type"), type.name())
                .set(field("active"), active ? 1 : 0)
                .where(field("id").eq(id))
                .execute();
    }

    public void setActive(long id, boolean active) {
        dsl.update(table("wallet"))
                .set(field("active"), active ? 1 : 0)
                .where(field("id").eq(id))
                .execute();
    }

    private Wallet mapToWallet(Record record) {
        return Wallet.builder()
                .id(record.get(field("id", Integer.class)).longValue())
                .name(record.get(field("name", String.class)))
                .type(WalletType.valueOf(record.get(field("type", String.class))))
                .active(record.get(field("active", Integer.class)) == 1)
                .createdAt(parseDateTime(record.get(field("created_at", String.class))))
                .build();
    }

    private LocalDateTime parseDateTime(String datetime) {
        return datetime != null ? LocalDateTime.parse(datetime, SQLITE_DATETIME) : null;
    }
}
