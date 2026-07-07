package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.model.Account;
import lombok.RequiredArgsConstructor;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.table;

@Repository
@RequiredArgsConstructor
public class AccountRepository {

    private final DSLContext dsl;

    public Optional<Account> findByUsername(String username) {
        return dsl.selectFrom(table("account"))
                .where(field("username").eq(username))
                .fetchOptional(this::mapToAccount);
    }

    public Optional<Account> findById(Integer id) {
        return dsl.selectFrom(table("account"))
                .where(field("id").eq(id))
                .fetchOptional(this::mapToAccount);
    }

    public boolean existsByUsername(String username) {
        return dsl.fetchExists(
                dsl.selectFrom(table("account"))
                        .where(field("username").eq(username))
        );
    }

    public Account save(String username, String passwordHash) {
        dsl.insertInto(table("account"))
                .columns(field("username"), field("password"), field("enabled"))
                .values(username, passwordHash, 1)
                .execute();

        return findByUsername(username).orElseThrow();
    }

    public void updatePassword(Integer id, String passwordHash) {
        dsl.update(table("account"))
                .set(field("password"), passwordHash)
                .where(field("id").eq(id))
                .execute();
    }

    public void updateEnabled(Integer id, boolean enabled) {
        dsl.update(table("account"))
                .set(field("enabled"), enabled ? 1 : 0)
                .where(field("id").eq(id))
                .execute();
    }

    private Account mapToAccount(Record record) {
        return Account.builder()
                .id(record.get(field("id", Integer.class)))
                .username(record.get(field("username", String.class)))
                .password(record.get(field("password", String.class)))
                .enabled(record.get(field("enabled", Integer.class)) == 1)
                .createdAt(toLocalDateTime(record.get(field("created_at", Timestamp.class))))
                .updatedAt(toLocalDateTime(record.get(field("updated_at", Timestamp.class))))
                .build();
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp != null ? timestamp.toLocalDateTime() : null;
    }
}
