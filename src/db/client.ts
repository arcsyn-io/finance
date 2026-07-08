import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "@/db/schema";

let database: ReturnType<typeof createDatabase> | undefined;

function createDatabase() {
  const env = getEnv();

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL deve estar configurada para acessar o banco.");
  }

  const queryClient = postgres(env.DATABASE_URL, {
    prepare: false,
  });

  return drizzle(queryClient, { schema });
}

export function getDb() {
  database ??= createDatabase();

  return database;
}

export const db = new Proxy({} as ReturnType<typeof createDatabase>, {
  get(_target, property) {
    const databaseClient = getDb();
    const value = Reflect.get(databaseClient, property);

    return typeof value === "function" ? value.bind(databaseClient) : value;
  },
});
