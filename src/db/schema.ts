import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const walletTypeEnum = pgEnum("wallet_type", [
  "CASH",
  "CREDIT_CARD",
  "NEGOTIABLE_SECURITY",
  "LONG_TERM",
  "ASSET",
]);

export const categoryTypeEnum = pgEnum("category_type", ["INCOME", "EXPENSE"]);

export const entryNatureEnum = pgEnum("entry_nature", [
  "OPERATIONAL",
  "PATRIMONIAL",
]);

export const entryDirectionEnum = pgEnum("entry_direction", ["IN", "OUT"]);

export const importStatusEnum = pgEnum("import_status", [
  "PENDING",
  "PENDING_REVIEW",
  "CONFIRMED",
  "CANCELLED",
]);

export const importSourceEnum = pgEnum("import_source", [
  "NUBANK_ACCOUNT",
  "NUBANK_CREDIT_CARD",
  "NUBANK_CSV",
  "NU_CONTA_CSV",
]);

export const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    legacyId: integer("legacy_id"),
    name: text("name").notNull(),
    type: walletTypeEnum("type").notNull(),
    initialBalanceCents: integer("initial_balance_cents").notNull().default(0),
    active: boolean("active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    userNameIdx: uniqueIndex("wallets_user_name_idx").on(
      table.userId,
      table.name,
    ),
    userTypeIdx: index("wallets_user_type_idx").on(table.userId, table.type),
    userLegacyIdIdx: uniqueIndex("wallets_user_legacy_id_idx").on(
      table.userId,
      table.legacyId,
    ),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    legacyId: integer("legacy_id"),
    name: text("name").notNull(),
    type: categoryTypeEnum("type").notNull(),
    icon: text("icon").notNull().default("Tag"),
    color: text("color").notNull().default("oklch(0.68 0.018 250)"),
    active: boolean("active").notNull().default(true),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    userNameIdx: uniqueIndex("categories_user_name_idx").on(
      table.userId,
      table.name,
    ),
    userTypeIdx: index("categories_user_type_idx").on(table.userId, table.type),
    userLegacyIdIdx: uniqueIndex("categories_user_legacy_id_idx").on(
      table.userId,
      table.legacyId,
    ),
  }),
);

export const economicEvents = pgTable(
  "economic_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    occurredOn: date("occurred_on").notNull(),
    ...timestamps,
  },
  (table) => ({
    userDateIdx: index("economic_events_user_date_idx").on(
      table.userId,
      table.occurredOn,
    ),
  }),
);

export const transfers = pgTable(
  "transfers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    legacyId: integer("legacy_id"),
    fromWalletId: uuid("from_wallet_id")
      .notNull()
      .references(() => wallets.id),
    toWalletId: uuid("to_wallet_id")
      .notNull()
      .references(() => wallets.id),
    fromCategoryId: uuid("from_category_id").references(() => categories.id),
    toCategoryId: uuid("to_category_id").references(() => categories.id),
    amountCents: integer("amount_cents").notNull(),
    occurredOn: date("occurred_on").notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => ({
    userDateIdx: index("transfers_user_date_idx").on(
      table.userId,
      table.occurredOn,
    ),
    userLegacyIdIdx: uniqueIndex("transfers_user_legacy_id_idx").on(
      table.userId,
      table.legacyId,
    ),
  }),
);

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    legacyId: integer("legacy_id"),
    walletId: uuid("wallet_id")
      .notNull()
      .references(() => wallets.id),
    categoryId: uuid("category_id").references(() => categories.id),
    transferId: uuid("transfer_id").references(() => transfers.id),
    economicEventId: uuid("economic_event_id").references(
      () => economicEvents.id,
    ),
    nature: entryNatureEnum("nature").notNull(),
    direction: entryDirectionEnum("direction").notNull(),
    amountCents: integer("amount_cents").notNull(),
    occurredOn: date("occurred_on").notNull(),
    description: text("description"),
    externalId: text("external_id"),
    economicEvent: text("economic_event"),
    receiptPath: text("receipt_path"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    userDateIdx: index("entries_user_date_idx").on(
      table.userId,
      table.occurredOn,
    ),
    userWalletIdx: index("entries_user_wallet_idx").on(
      table.userId,
      table.walletId,
    ),
    userWalletExternalIdx: uniqueIndex("entries_user_wallet_external_idx").on(
      table.userId,
      table.walletId,
      table.externalId,
    ),
    userLegacyIdIdx: uniqueIndex("entries_user_legacy_id_idx").on(
      table.userId,
      table.legacyId,
    ),
  }),
);

export const importRequests = pgTable(
  "import_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    legacyId: integer("legacy_id"),
    source: importSourceEnum("source").notNull(),
    status: importStatusEnum("status").notNull().default("PENDING"),
    fileName: text("file_name").notNull(),
    nature: entryNatureEnum("nature"),
    economicEvent: text("economic_event"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    defaultWalletId: uuid("default_wallet_id").references(() => wallets.id),
    defaultCategoryId: uuid("default_category_id").references(
      () => categories.id,
    ),
    ...timestamps,
  },
  (table) => ({
    userStatusIdx: index("import_requests_user_status_idx").on(
      table.userId,
      table.status,
    ),
    userLegacyIdIdx: uniqueIndex("import_requests_user_legacy_id_idx").on(
      table.userId,
      table.legacyId,
    ),
  }),
);

export const importRows = pgTable(
  "import_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importRequestId: uuid("import_request_id")
      .notNull()
      .references(() => importRequests.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    legacyId: integer("legacy_id"),
    rowNumber: integer("row_number").notNull(),
    occurredOn: date("occurred_on").notNull(),
    description: text("description"),
    amountCents: integer("amount_cents").notNull(),
    direction: entryDirectionEnum("direction").notNull(),
    nature: entryNatureEnum("nature"),
    walletId: uuid("wallet_id").references(() => wallets.id),
    categoryId: uuid("category_id").references(() => categories.id),
    externalId: text("external_id"),
    valid: boolean("valid").notNull().default(true),
    validationErrors: text("validation_errors"),
    economicEvent: text("economic_event"),
    entryId: uuid("entry_id").references(() => entries.id),
    ignoredAt: timestamp("ignored_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    requestRowIdx: uniqueIndex("import_rows_request_row_idx").on(
      table.importRequestId,
      table.rowNumber,
    ),
    userRequestIdx: index("import_rows_user_request_idx").on(
      table.userId,
      table.importRequestId,
    ),
    userLegacyIdIdx: uniqueIndex("import_rows_user_legacy_id_idx").on(
      table.userId,
      table.legacyId,
    ),
  }),
);

export const cashFlowConfigs = pgTable(
  "cash_flow_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    legacyId: integer("legacy_id"),
    referenceMonth: text("reference_month").notNull(),
    openingBalanceCents: integer("opening_balance_cents").notNull(),
    minimumCashCents: integer("minimum_cash_cents").notNull(),
    ...timestamps,
  },
  (table) => ({
    userReferenceMonthIdx: uniqueIndex(
      "cash_flow_configs_user_reference_month_idx",
    ).on(table.userId, table.referenceMonth),
    userLegacyIdIdx: uniqueIndex("cash_flow_configs_user_legacy_id_idx").on(
      table.userId,
      table.legacyId,
    ),
  }),
);
