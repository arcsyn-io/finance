import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
  DATABASE_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
  SUPABASE_STORAGE_RECEIPTS_BUCKET: z.string().min(1).default("receipts"),
});

export function getEnv() {
  return envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    DATABASE_IDLE_TIMEOUT_SECONDS: process.env.DATABASE_IDLE_TIMEOUT_SECONDS,
    DATABASE_CONNECT_TIMEOUT_SECONDS: process.env.DATABASE_CONNECT_TIMEOUT_SECONDS,
    SUPABASE_STORAGE_RECEIPTS_BUCKET:
      process.env.SUPABASE_STORAGE_RECEIPTS_BUCKET,
  });
}
