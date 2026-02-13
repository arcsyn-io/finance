package com.lucaskalb.finance.repository;

import com.lucaskalb.finance.dto.CategoryConsumption;
import com.lucaskalb.finance.dto.MonthlyConsumption;
import com.lucaskalb.finance.model.EconomicEvent;
import com.lucaskalb.finance.model.Entry;
import com.lucaskalb.finance.model.EntryDirection;
import com.lucaskalb.finance.model.EntryNature;
import lombok.RequiredArgsConstructor;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
                    field("e.transfer_id"),
                    field("e.economic_event"),
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

    public List<Entry> findByTransferId(long transferId) {
        return dsl.select(
                    field("e.id"),
                    field("e.wallet_id"),
                    field("e.category_id"),
                    field("e.nature"),
                    field("e.direction"),
                    field("e.amount"),
                    field("e.occurred_at"),
                    field("e.description"),
                    field("e.transfer_id"),
                    field("e.economic_event"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.transfer_id").eq(transferId))
                .orderBy(field("e.direction").asc())
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
                    field("e.transfer_id"),
                    field("e.economic_event"),
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
                       long amount, LocalDateTime occurredAt, String description, EconomicEvent economicEvent) {
        return insert(walletId, categoryId, nature, direction, amount, occurredAt, description, null, economicEvent);
    }

    public long insert(long walletId, long categoryId, EntryNature nature, EntryDirection direction,
                       long amount, LocalDateTime occurredAt, String description, String externalId,
                       EconomicEvent economicEvent) {
        dsl.insertInto(table("entry"))
                .columns(
                    field("wallet_id"),
                    field("category_id"),
                    field("nature"),
                    field("direction"),
                    field("amount"),
                    field("occurred_at"),
                    field("description"),
                    field("external_id"),
                    field("economic_event")
                )
                .values(
                    walletId,
                    categoryId,
                    nature.name(),
                    direction.name(),
                    amount,
                    occurredAt.format(SQLITE_DATETIME),
                    description,
                    externalId,
                    economicEvent != null ? economicEvent.name() : null
                )
                .execute();

        return dsl.select(field("last_insert_rowid()"))
                .fetchOne(0, Long.class);
    }

    public boolean existsByExternalIdAndWallet(String externalId, long walletId) {
        if (externalId == null) {
            return false;
        }
        return dsl.selectCount()
                .from(table("entry"))
                .where(field("external_id").eq(externalId))
                .and(field("wallet_id").eq(walletId))
                .and(field("deleted_at").isNull())
                .fetchOne(0, Integer.class) > 0;
    }

    public long insertWithTransfer(long walletId, long categoryId, EntryNature nature, EntryDirection direction,
                                   long amount, LocalDateTime occurredAt, String description, long transferId) {
        dsl.insertInto(table("entry"))
                .columns(
                    field("wallet_id"),
                    field("category_id"),
                    field("nature"),
                    field("direction"),
                    field("amount"),
                    field("occurred_at"),
                    field("description"),
                    field("transfer_id"),
                    field("economic_event")
                )
                .values(
                    walletId,
                    categoryId,
                    nature.name(),
                    direction.name(),
                    amount,
                    occurredAt.format(SQLITE_DATETIME),
                    description,
                    transferId,
                    EconomicEvent.TRANSFER.name()
                )
                .execute();

        return dsl.select(field("last_insert_rowid()"))
                .fetchOne(0, Long.class);
    }

    public void update(long id, long walletId, long categoryId, EntryNature nature, EntryDirection direction,
                       long amount, LocalDateTime occurredAt, String description, EconomicEvent economicEvent) {
        dsl.update(table("entry"))
                .set(field("wallet_id"), walletId)
                .set(field("category_id"), categoryId)
                .set(field("nature"), nature.name())
                .set(field("direction"), direction.name())
                .set(field("amount"), amount)
                .set(field("occurred_at"), occurredAt.format(SQLITE_DATETIME))
                .set(field("description"), description)
                .set(field("economic_event"), economicEvent != null ? economicEvent.name() : null)
                .where(field("id").eq(id))
                .execute();
    }

    public List<Entry> listLatest(int limit) {
        return dsl.select(
                    field("e.id"),
                    field("e.wallet_id"),
                    field("e.category_id"),
                    field("e.nature"),
                    field("e.direction"),
                    field("e.amount"),
                    field("e.occurred_at"),
                    field("e.description"),
                    field("e.transfer_id"),
                    field("e.economic_event"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .orderBy(field("e.occurred_at").desc(), field("e.id").desc())
                .limit(limit)
                .fetch(this::mapToEntry);
    }

    public long calculateTotalBalance() {
        var inTotal = dsl.select(field("COALESCE(SUM(amount), 0)"))
                .from(table("entry"))
                .where(field("deleted_at").isNull())
                .and(field("direction").eq(EntryDirection.IN.name()))
                .fetchOne(0, Long.class);

        var outTotal = dsl.select(field("COALESCE(SUM(amount), 0)"))
                .from(table("entry"))
                .where(field("deleted_at").isNull())
                .and(field("direction").eq(EntryDirection.OUT.name()))
                .fetchOne(0, Long.class);

        return inTotal - outTotal;
    }

    public long calculateBalanceByWalletAndPeriod(long walletId, LocalDateTime startDate, LocalDateTime endDate) {
        var inTotal = dsl.select(field("COALESCE(SUM(amount), 0)"))
                .from(table("entry"))
                .where(field("deleted_at").isNull())
                .and(field("wallet_id").eq(walletId))
                .and(field("direction").eq(EntryDirection.IN.name()))
                .and(field("occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);

        var outTotal = dsl.select(field("COALESCE(SUM(amount), 0)"))
                .from(table("entry"))
                .where(field("deleted_at").isNull())
                .and(field("wallet_id").eq(walletId))
                .and(field("direction").eq(EntryDirection.OUT.name()))
                .and(field("occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);

        return inTotal - outTotal;
    }

    public long calculateBalanceByWalletTypes(List<String> walletTypes) {
        var inTotal = dsl.select(field("COALESCE(SUM(e.amount), 0)"))
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(EntryDirection.IN.name()))
                .and(field("w.type").in(walletTypes))
                .fetchOne(0, Long.class);

        var outTotal = dsl.select(field("COALESCE(SUM(e.amount), 0)"))
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(EntryDirection.OUT.name()))
                .and(field("w.type").in(walletTypes))
                .fetchOne(0, Long.class);

        return inTotal - outTotal;
    }

    public long calculatePeriodIncome(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(field("COALESCE(SUM(amount), 0)"))
                .from(table("entry"))
                .where(field("deleted_at").isNull())
                .and(field("direction").eq(EntryDirection.IN.name()))
                .and(field("occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("occurred_at").le(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);
    }

    public long calculatePeriodExpense(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(field("COALESCE(SUM(amount), 0)"))
                .from(table("entry"))
                .where(field("deleted_at").isNull())
                .and(field("direction").eq(EntryDirection.OUT.name()))
                .and(field("occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("occurred_at").le(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);
    }

    public void batchUpdateWallet(List<Long> ids, long walletId) {
        dsl.update(table("entry"))
                .set(field("wallet_id"), walletId)
                .where(field("id").in(ids))
                .execute();
    }

    public void batchUpdateCategory(List<Long> ids, long categoryId, EntryDirection direction) {
        dsl.update(table("entry"))
                .set(field("category_id"), categoryId)
                .set(field("direction"), direction.name())
                .where(field("id").in(ids))
                .execute();
    }

    public void batchUpdateNature(List<Long> ids, EntryNature nature) {
        dsl.update(table("entry"))
                .set(field("nature"), nature.name())
                .where(field("id").in(ids))
                .execute();
    }

    public void batchUpdateEconomicEvent(List<Long> ids, EconomicEvent economicEvent) {
        dsl.update(table("entry"))
                .set(field("economic_event"), economicEvent.name())
                .where(field("id").in(ids))
                .execute();
    }

    public void batchSoftDelete(List<Long> ids) {
        dsl.update(table("entry"))
                .set(field("deleted_at"), LocalDateTime.now().format(SQLITE_DATETIME))
                .where(field("id").in(ids))
                .and(field("deleted_at").isNull())
                .execute();
    }

    public List<CategoryConsumption> getConsumptionByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(
                    field("c.id"),
                    field("c.name"),
                    field("SUM(e.amount)").as("total")
                )
                .from(table("entry").as("e"))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.economic_event").eq(EconomicEvent.CONSUMPTION.name()))
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .groupBy(field("c.id"), field("c.name"))
                .orderBy(field("total").desc())
                .fetch(r -> new CategoryConsumption(
                        ((Number) r.get("c.id")).longValue(),
                        (String) r.get("c.name"),
                        ((Number) r.get("total")).longValue()
                ));
    }

    public List<MonthlyConsumption> getMonthlyConsumptionByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(
                    field("strftime('%Y-%m', e.occurred_at)").as("month"),
                    field("c.id"),
                    field("c.name"),
                    field("SUM(e.amount)").as("total")
                )
                .from(table("entry").as("e"))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.economic_event").eq(EconomicEvent.CONSUMPTION.name()))
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .groupBy(field("strftime('%Y-%m', e.occurred_at)"), field("c.id"), field("c.name"))
                .orderBy(field("month").asc(), field("total").desc())
                .fetch(r -> new MonthlyConsumption(
                        YearMonth.parse((String) r.get("month")),
                        ((Number) r.get("c.id")).longValue(),
                        (String) r.get("c.name"),
                        ((Number) r.get("total")).longValue()
                ));
    }

    public long getTotalConsumption(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(field("COALESCE(SUM(e.amount), 0)"))
                .from(table("entry").as("e"))
                .where(field("e.deleted_at").isNull())
                .and(field("e.economic_event").eq(EconomicEvent.CONSUMPTION.name()))
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);
    }

    /**
     * Calcula recebimentos mensais para fluxo de caixa.
     * Considera apenas: wallet.type = CASH, nature = OPERATIONAL, transfer_id IS NULL
     */
    public long calculateMonthlyCashFlowReceipts(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(field("COALESCE(SUM(e.amount), 0)"))
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(EntryDirection.IN.name()))
                .and(field("e.nature").eq(EntryNature.OPERATIONAL.name()))
                .and(field("w.type").eq("CASH"))
                .and(field("e.transfer_id").isNull())
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);
    }

    /**
     * Lista lançamentos do fluxo de caixa para um período e direção.
     * Mesmos filtros de calculateMonthlyCashFlowReceipts/Expenses.
     */
    public List<Entry> listCashFlowEntries(LocalDateTime startDate, LocalDateTime endDate, EntryDirection direction) {
        return dsl.select(
                    field("e.id"),
                    field("e.wallet_id"),
                    field("e.category_id"),
                    field("e.nature"),
                    field("e.direction"),
                    field("e.amount"),
                    field("e.occurred_at"),
                    field("e.description"),
                    field("e.transfer_id"),
                    field("e.economic_event"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(direction.name()))
                .and(field("e.nature").eq(EntryNature.OPERATIONAL.name()))
                .and(field("w.type").eq("CASH"))
                .and(field("e.transfer_id").isNull())
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .orderBy(field("e.occurred_at").desc(), field("e.id").desc())
                .fetch(this::mapToEntry);
    }

    /**
     * Calcula despesas mensais para fluxo de caixa.
     * Considera apenas: wallet.type = CASH, nature = OPERATIONAL, transfer_id IS NULL
     */
    public long calculateMonthlyCashFlowExpenses(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(field("COALESCE(SUM(e.amount), 0)"))
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(EntryDirection.OUT.name()))
                .and(field("e.nature").eq(EntryNature.OPERATIONAL.name()))
                .and(field("w.type").eq("CASH"))
                .and(field("e.transfer_id").isNull())
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);
    }

    /**
     * Lista lançamentos operacionais em carteiras CASH para um período, direção e categoria.
     * Mesmos filtros de calculateMonthlyCashFlowReceipts/Expenses, com filtro adicional de categoria.
     */
    public List<Entry> listOperationalCashEntries(LocalDateTime startDate, LocalDateTime endDate,
                                                    EntryDirection direction, long categoryId) {
        return dsl.select(
                    field("e.id"),
                    field("e.wallet_id"),
                    field("e.category_id"),
                    field("e.nature"),
                    field("e.direction"),
                    field("e.amount"),
                    field("e.occurred_at"),
                    field("e.description"),
                    field("e.transfer_id"),
                    field("e.economic_event"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(direction.name()))
                .and(field("e.category_id").eq(categoryId))
                .and(field("e.nature").eq(EntryNature.OPERATIONAL.name()))
                .and(field("w.type").eq("CASH"))
                .and(field("e.transfer_id").isNull())
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .orderBy(field("e.occurred_at").desc(), field("e.id").desc())
                .fetch(this::mapToEntry);
    }

    /**
     * Lista lançamentos não-operacionais em carteiras CASH para um período, direção e categoria.
     * Mesmos filtros de calculateMonthlyNonOperationalCash*, com filtro adicional de categoria.
     */
    public List<Entry> listNonOperationalCashEntries(LocalDateTime startDate, LocalDateTime endDate,
                                                      EntryDirection direction, long categoryId) {
        return dsl.select(
                    field("e.id"),
                    field("e.wallet_id"),
                    field("e.category_id"),
                    field("e.nature"),
                    field("e.direction"),
                    field("e.amount"),
                    field("e.occurred_at"),
                    field("e.description"),
                    field("e.transfer_id"),
                    field("e.economic_event"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(direction.name()))
                .and(field("e.category_id").eq(categoryId))
                .and(field("w.type").eq("CASH"))
                .and(
                    field("e.nature").ne(EntryNature.OPERATIONAL.name())
                    .or(field("e.transfer_id").isNotNull())
                )
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .orderBy(field("e.occurred_at").desc(), field("e.id").desc())
                .fetch(this::mapToEntry);
    }

    /**
     * Calcula entradas não-operacionais em carteiras CASH (resgates, transferências recebidas).
     * Complemento do fluxo de caixa: wallet.type = CASH, mas (nature != OPERATIONAL ou transfer_id IS NOT NULL).
     */
    public long calculateMonthlyNonOperationalCashIn(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(field("COALESCE(SUM(e.amount), 0)"))
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(EntryDirection.IN.name()))
                .and(field("w.type").eq("CASH"))
                .and(
                    field("e.nature").ne(EntryNature.OPERATIONAL.name())
                    .or(field("e.transfer_id").isNotNull())
                )
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);
    }

    /**
     * Lista movimentações não-operacionais em carteiras CASH agrupadas por mês, categoria e direção.
     * Mesmos critérios dos métodos calculateMonthlyNonOperationalCash*.
     * Retorna: [month (YYYY-MM), categoryId, categoryName, direction, total]
     */
    public List<Object[]> listNonOperationalCashByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(
                    field("strftime('%Y-%m', e.occurred_at)").as("month"),
                    field("c.id"),
                    field("c.name"),
                    field("e.direction"),
                    field("SUM(e.amount)").as("total")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("w.type").eq("CASH"))
                .and(
                    field("e.nature").ne(EntryNature.OPERATIONAL.name())
                    .or(field("e.transfer_id").isNotNull())
                )
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .groupBy(field("strftime('%Y-%m', e.occurred_at)"), field("c.id"), field("c.name"), field("e.direction"))
                .orderBy(field("total").desc())
                .fetch(r -> new Object[]{
                        (String) r.get("month"),
                        ((Number) r.get("c.id")).longValue(),
                        (String) r.get("c.name"),
                        (String) r.get("e.direction"),
                        ((Number) r.get("total")).longValue()
                });
    }

    /**
     * Lista movimentações operacionais em carteiras CASH agrupadas por mês, categoria e direção.
     * Mesmos critérios dos métodos calculateMonthlyCashFlowReceipts/Expenses.
     * Retorna: [month (YYYY-MM), categoryId, categoryName, direction, total]
     */
    public List<Object[]> listOperationalCashByCategory(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(
                    field("strftime('%Y-%m', e.occurred_at)").as("month"),
                    field("c.id"),
                    field("c.name"),
                    field("e.direction"),
                    field("SUM(e.amount)").as("total")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("w.type").eq("CASH"))
                .and(field("e.nature").eq(EntryNature.OPERATIONAL.name()))
                .and(field("e.transfer_id").isNull())
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .groupBy(field("strftime('%Y-%m', e.occurred_at)"), field("c.id"), field("c.name"), field("e.direction"))
                .orderBy(field("total").desc())
                .fetch(r -> new Object[]{
                        (String) r.get("month"),
                        ((Number) r.get("c.id")).longValue(),
                        (String) r.get("c.name"),
                        (String) r.get("e.direction"),
                        ((Number) r.get("total")).longValue()
                });
    }

    /**
     * Calcula saídas não-operacionais de carteiras CASH (aplicações, transferências enviadas).
     * Complemento do fluxo de caixa: wallet.type = CASH, mas (nature != OPERATIONAL ou transfer_id IS NOT NULL).
     */
    public long calculateMonthlyNonOperationalCashOut(LocalDateTime startDate, LocalDateTime endDate) {
        return dsl.select(field("COALESCE(SUM(e.amount), 0)"))
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .where(field("e.deleted_at").isNull())
                .and(field("e.direction").eq(EntryDirection.OUT.name()))
                .and(field("w.type").eq("CASH"))
                .and(
                    field("e.nature").ne(EntryNature.OPERATIONAL.name())
                    .or(field("e.transfer_id").isNotNull())
                )
                .and(field("e.occurred_at").ge(startDate.format(SQLITE_DATETIME)))
                .and(field("e.occurred_at").lt(endDate.format(SQLITE_DATETIME)))
                .fetchOne(0, Long.class);
    }

    private Entry mapToEntry(Record record) {
        var transferId = record.get(field("e.transfer_id", Integer.class));
        var economicEventStr = record.get(field("e.economic_event", String.class));
        return Entry.builder()
                .id(record.get(field("e.id", Integer.class)).longValue())
                .walletId(record.get(field("e.wallet_id", Integer.class)).longValue())
                .categoryId(record.get(field("e.category_id", Integer.class)).longValue())
                .nature(EntryNature.valueOf(record.get(field("e.nature", String.class))))
                .direction(EntryDirection.valueOf(record.get(field("e.direction", String.class))))
                .amount(record.get(field("e.amount", Integer.class)).longValue())
                .occurredAt(parseDateTime(record.get(field("e.occurred_at", String.class))))
                .description(record.get(field("e.description", String.class)))
                .transferId(transferId != null ? transferId.longValue() : null)
                .economicEvent(economicEventStr != null ? EconomicEvent.valueOf(economicEventStr) : null)
                .createdAt(parseDateTime(record.get(field("e.created_at", String.class))))
                .deletedAt(parseDateTime(record.get(field("e.deleted_at", String.class))))
                .walletName(record.get(field("wallet_name", String.class)))
                .categoryName(record.get(field("category_name", String.class)))
                .build();
    }

    /**
     * Busca candidatos para vincular como transferência.
     * Retorna entries com: direção oposta, carteira diferente, não deletados, sem transfer_id.
     * Filtros opcionais: mesma data, mesmo valor.
     */
    public List<Entry> findLinkCandidates(long sourceEntryId, Long walletId, EntryDirection oppositeDirection,
                                           Long amount, LocalDateTime occurredAt) {
        Condition condition = trueCondition()
                .and(field("e.id").ne(sourceEntryId))
                .and(field("e.deleted_at").isNull())
                .and(field("e.transfer_id").isNull())
                .and(field("e.direction").eq(oppositeDirection.name()));

        if (walletId != null) {
            condition = condition.and(field("e.wallet_id").ne(walletId));
        }
        if (amount != null) {
            condition = condition.and(field("e.amount").eq(amount));
        }
        if (occurredAt != null) {
            var dateStr = occurredAt.toLocalDate().atStartOfDay().format(SQLITE_DATETIME);
            var nextDateStr = occurredAt.toLocalDate().plusDays(1).atStartOfDay().format(SQLITE_DATETIME);
            condition = condition.and(field("e.occurred_at").ge(dateStr))
                    .and(field("e.occurred_at").lt(nextDateStr));
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
                    field("e.transfer_id"),
                    field("e.economic_event"),
                    field("e.created_at"),
                    field("e.deleted_at"),
                    field("w.name").as("wallet_name"),
                    field("c.name").as("category_name")
                )
                .from(table("entry").as("e"))
                .join(table("wallet").as("w")).on(field("e.wallet_id").eq(field("w.id")))
                .join(table("category").as("c")).on(field("e.category_id").eq(field("c.id")))
                .where(condition)
                .orderBy(field("e.occurred_at").desc(), field("e.id").desc())
                .limit(50)
                .fetch(this::mapToEntry);
    }

    public void updateFields(long id, long walletId, long categoryId, EntryNature nature,
                             EntryDirection direction, String description, EconomicEvent economicEvent) {
        dsl.update(table("entry"))
                .set(field("wallet_id"), walletId)
                .set(field("category_id"), categoryId)
                .set(field("nature"), nature.name())
                .set(field("direction"), direction.name())
                .set(field("description"), description)
                .set(field("economic_event"), economicEvent != null ? economicEvent.name() : null)
                .where(field("id").eq(id))
                .execute();
    }

    public void updateTransferId(long entryId, long transferId) {
        dsl.update(table("entry"))
                .set(field("transfer_id"), transferId)
                .set(field("economic_event"), EconomicEvent.TRANSFER.name())
                .where(field("id").eq(entryId))
                .execute();
    }

    public void clearTransferId(long entryId) {
        dsl.update(table("entry"))
                .setNull(field("transfer_id"))
                .where(field("id").eq(entryId))
                .execute();
    }

    private LocalDateTime parseDateTime(String datetime) {
        return datetime != null ? LocalDateTime.parse(datetime, SQLITE_DATETIME) : null;
    }

    /**
     * Calcula o saldo de cada carteira.
     * Retorna um mapa de wallet_id -> saldo (em centavos).
     */
    public Map<Long, Long> calculateBalanceByWallet() {
        var result = new HashMap<Long, Long>();

        // Agrupa por wallet_id e calcula IN - OUT
        dsl.select(
                    field("wallet_id"),
                    field("direction"),
                    field("SUM(amount)").as("total")
                )
                .from(table("entry"))
                .where(field("deleted_at").isNull())
                .groupBy(field("wallet_id"), field("direction"))
                .fetch()
                .forEach(r -> {
                    var walletId = ((Number) r.get("wallet_id")).longValue();
                    var direction = (String) r.get("direction");
                    var total = ((Number) r.get("total")).longValue();

                    var currentBalance = result.getOrDefault(walletId, 0L);
                    if (EntryDirection.IN.name().equals(direction)) {
                        result.put(walletId, currentBalance + total);
                    } else {
                        result.put(walletId, currentBalance - total);
                    }
                });

        return result;
    }
}
