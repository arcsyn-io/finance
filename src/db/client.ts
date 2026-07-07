import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { getEnv } from "@/lib/env";
import * as schema from "@/db/schema";

const env = getEnv();

if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL deve estar configurada para acessar o banco.");
}

const queryClient = postgres(env.DATABASE_URL, {
  prepare: false,
});

export const db = drizzle(queryClient, { schema });
