package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.model.Category;
import com.lucaskalb.finance.model.CategoryType;
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
public class CategoryRepository {

    private static final DateTimeFormatter SQLITE_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final DSLContext dsl;

    public List<Category> listAll(boolean includeInactive) {
        if (includeInactive) {
            return dsl.selectFrom(table("category"))
                    .orderBy(field("name"))
                    .fetch(this::mapToCategory);
        }
        return dsl.selectFrom(table("category"))
                .where(field("active").eq(1))
                .orderBy(field("name"))
                .fetch(this::mapToCategory);
    }

    public Optional<Category> findById(long id) {
        return dsl.selectFrom(table("category"))
                .where(field("id").eq(id))
                .fetchOptional(this::mapToCategory);
    }

    public Optional<Category> findByName(String name) {
        return dsl.selectFrom(table("category"))
                .where(lower(field("name", String.class)).eq(name.toLowerCase()))
                .fetchOptional(this::mapToCategory);
    }

    public long insert(String name, CategoryType type) {
        dsl.insertInto(table("category"))
                .columns(field("name"), field("type"))
                .values(name, type.name())
                .execute();

        return dsl.select(field("last_insert_rowid()"))
                .fetchOne(0, Long.class);
    }

    public void update(long id, String name, CategoryType type, boolean active) {
        dsl.update(table("category"))
                .set(field("name"), name)
                .set(field("type"), type.name())
                .set(field("active"), active ? 1 : 0)
                .where(field("id").eq(id))
                .execute();
    }

    public void setActive(long id, boolean active) {
        dsl.update(table("category"))
                .set(field("active"), active ? 1 : 0)
                .where(field("id").eq(id))
                .execute();
    }

    private Category mapToCategory(Record record) {
        return Category.builder()
                .id(record.get(field("id", Integer.class)).longValue())
                .name(record.get(field("name", String.class)))
                .type(CategoryType.valueOf(record.get(field("type", String.class))))
                .active(record.get(field("active", Integer.class)) == 1)
                .createdAt(parseDateTime(record.get(field("created_at", String.class))))
                .build();
    }

    private LocalDateTime parseDateTime(String datetime) {
        return datetime != null ? LocalDateTime.parse(datetime, SQLITE_DATETIME) : null;
    }
}
