# Desenvolvimento local

Este projeto usa Supabase local para reproduzir `auth`, `storage`, RLS e Postgres.

## Pre-requisitos

- Node.js 22.
- pnpm 11.
- Docker Desktop.
- Supabase CLI.

No Windows, rode os comandos pelo PowerShell.

## Primeiro uso

1. Copie o arquivo de variaveis:

```powershell
Copy-Item .env.local.example .env.local
```

2. Suba o Supabase local:

```powershell
pnpm supabase:start
```

3. Copie `anon key` e `service_role key` exibidas por:

```powershell
pnpm supabase:status
```

4. Preencha `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`.

5. Aplique migrations e seed importado:

```powershell
pnpm supabase:reset
```

6. Inicie o Next.js:

```powershell
pnpm dev:local
```

A aplicacao fica em `http://127.0.0.1:3000`. O Supabase Studio local fica em `http://127.0.0.1:54323`.

## Usuario local com dados importados

A migration `000599_create_local_import_user.sql` cria o usuario usado pelo seed legado:

```text
Email: logins@arcsyn.io
Senha: finance-local-dev
```

O ambiente local habilita TOTP em `supabase/config.toml`, entao o fluxo de cadastro de MFA pode ser testado com um app autenticador.

## Rotina diaria

```powershell
pnpm supabase:start
pnpm dev:local
```

Para recriar o banco local a partir das migrations:

```powershell
pnpm supabase:reset
```

Para parar os containers:

```powershell
pnpm supabase:stop
```

## Observacoes

- `.env.local` nao deve ser versionado.
- As migrations em `supabase/migrations` sao a fonte do schema local.
- Use `pnpm lint`, `pnpm typecheck` e `pnpm test` antes de fechar alteracoes de codigo.
