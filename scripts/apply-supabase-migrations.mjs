import { readdirSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const migrationsDir = join(process.cwd(), "supabase", "migrations");

const migrationFiles = readdirSync(migrationsDir)
  .filter((fileName) => fileName.endsWith(".sql"))
  .map((fileName) => {
    const match = fileName.match(/^([0-9]+)_([a-z0-9_]+)\.sql$/i);

    if (!match) {
      throw new Error(`Nome de migration invalido: ${fileName}`);
    }

    return {
      fileName,
      name: match[2],
      path: join(migrationsDir, fileName),
      version: match[1],
    };
  })
  .sort((left, right) => left.version.localeCompare(right.version));

configurePostgresEnvironment();
ensurePsqlExists();
ensureMigrationTable();

const appliedVersions = new Set(
  queryAppliedVersions()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean),
);

const pending = migrationFiles.filter(
  (migration) => !appliedVersions.has(migration.version),
);

if (pending.length === 0) {
  console.log("Nenhuma migration pendente.");
  process.exit(0);
}

console.log(
  `Migrations pendentes: ${pending
    .map((migration) => migration.fileName)
    .join(", ")}`,
);

if (dryRun) {
  process.exit(0);
}

for (const migration of pending) {
  console.log(`Aplicando ${migration.fileName}`);
  runPsql(["-v", "ON_ERROR_STOP=1", "-f", migration.path]);
  registerMigration(migration);
}

console.log("Migrations aplicadas com sucesso.");

function configurePostgresEnvironment() {
  process.env.PGHOST ??= process.env.SUPABASE_PROJECT_ID
    ? `db.${process.env.SUPABASE_PROJECT_ID}.supabase.co`
    : undefined;
  process.env.PGPORT ??= "5432";
  process.env.PGDATABASE ??= "postgres";
  process.env.PGUSER ??= "postgres";
  process.env.PGPASSWORD ??= process.env.SUPABASE_DB_PASSWORD;
  process.env.PGSSLMODE ??= "require";

  const missing = ["PGHOST", "PGPASSWORD"].filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Variaveis obrigatorias ausentes para aplicar migrations: ${missing.join(
        ", ",
      )}`,
    );
  }
}

function ensurePsqlExists() {
  const result = spawnSync("psql", ["--version"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error("psql nao esta disponivel no PATH.");
  }
}

function ensureMigrationTable() {
  runPsql([
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `
      create schema if not exists supabase_migrations;
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key,
        statements text[],
        name text
      );
    `,
  ]);
}

function queryAppliedVersions() {
  return runPsql([
    "-At",
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    "select version from supabase_migrations.schema_migrations order by version;",
  ]);
}

function registerMigration({ name, version }) {
  runPsql([
    "-v",
    "ON_ERROR_STOP=1",
    "-c",
    `
      insert into supabase_migrations.schema_migrations (
        version,
        name,
        statements
      )
      select '${version}', '${name}', array[]::text[]
      where not exists (
        select 1
        from supabase_migrations.schema_migrations
        where version = '${version}'
      );
    `,
  ]);
}

function runPsql(args) {
  const result = spawnSync("psql", args, {
    encoding: "utf8",
    env: process.env,
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    throw new Error(
      [
        "Falha ao executar psql.",
        result.stdout.trim(),
        result.stderr.trim(),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  if (result.stderr.trim()) {
    process.stderr.write(result.stderr);
  }

  return result.stdout;
}
