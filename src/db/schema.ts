import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const walletTypeEnum = pgEnum("wallet_type", [
  "CASH",
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
  "CONFIRMED",
  "CANCELLED",
]);

export const importSourceEnum = pgEnum("import_source", [
  "NUBANK_ACCOUNT",
  "NUBANK_CREDIT_CARD",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    type: walletTypeEnum("type").notNull(),
    initialBalanceCents: integer("initial_balance_cents").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    userNameIdx: uniqueIndex("wallets_user_name_idx").on(
      table.userId,
      table.name,
    ),
    userTypeIdx: index("wallets_user_type_idx").on(table.userId, table.type),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    type: categoryTypeEnum("type").notNull(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => ({
    userNameIdx: uniqueIndex("categories_user_name_idx").on(
      table.userId,
      table.name,
    ),
    userTypeIdx: index("categories_user_type_idx").on(table.userId, table.type),
  }),
);

export const economicEvents = pgTable(
  "economic_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
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
    userId: uuid("user_id").notNull(),
    fromWalletId: uuid("from_wallet_id")
      .notNull()
      .references(() => wallets.id),
    toWalletId: uuid("to_wallet_id")
      .notNull()
      .references(() => wallets.id),
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
  }),
);

export const entries = pgTable(
  "entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
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
    description: text("description").notNull(),
    externalId: text("external_id"),
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
    userExternalIdx: uniqueIndex("entries_user_external_idx").on(
      table.userId,
      table.externalId,
    ),
  }),
);

export const importRequests = pgTable(
  "import_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    source: importSourceEnum("source").notNull(),
    status: importStatusEnum("status").notNull().default("PENDING"),
    fileName: text("file_name").notNull(),
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
  }),
);

export const importRows = pgTable(
  "import_rows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    importRequestId: uuid("import_request_id")
      .notNull()
      .references(() => importRequests.id),
    userId: uuid("user_id").notNull(),
    rowNumber: integer("row_number").notNull(),
    occurredOn: date("occurred_on").notNull(),
    description: text("description").notNull(),
    amountCents: integer("amount_cents").notNull(),
    direction: entryDirectionEnum("direction").notNull(),
    nature: entryNatureEnum("nature").notNull().default("OPERATIONAL"),
    walletId: uuid("wallet_id").references(() => wallets.id),
    categoryId: uuid("category_id").references(() => categories.id),
    externalId: text("external_id"),
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
  }),
);
