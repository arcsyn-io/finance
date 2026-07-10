# Implementation Plan: Transacoes

**Branch**: `master` | **Date**: 2026-07-10 | **Spec**: `specs/005-transactions/spec.md`

## Summary

Implementar a tela de transacoes na stack atual Next.js/TypeScript, usando `old/` apenas para recuperar regras de dominio de lancamentos e `finance-prototipo.zip` como referencia visual.

## Technical Context

- Next.js App Router
- TypeScript
- Supabase/Postgres
- Zod
- pnpm
- Route Handlers JSON para comunicacao front/back

## Structure

```text
src/
|-- app/
|   |-- (private)/transactions/page.tsx
|   `-- api/entries/
|-- domain/entry/
|-- modules/entries/components/
|-- server/
|   |-- commands/entry-commands.ts
|   |-- controllers/entry-controller.ts
|   |-- mappers/entry-mapper.ts
|   |-- repositories/entry-repository.ts
|   |-- schemas/entry-schema.ts
|   |-- services/entry-service.ts
|   `-- usecases/entry/
`-- test/
    |-- entry-controller.test.ts
    `-- entry-service.test.ts
```

## Validation Plan

1. Criar testes de service e controller primeiro.
2. Confirmar falha inicial dos testes de transacoes.
3. Implementar dominio, backend JSON e UI.
4. Rodar `pnpm test`, `pnpm lint` e `pnpm typecheck`.
